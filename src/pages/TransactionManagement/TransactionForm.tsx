import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Search, Edit } from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "notistack";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Header } from "@/components/Header";
import PageLoader from "@/components/PageLoader";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import InputMonthPickerField from "@/components/InputMonthPickerField";
import {
  TransactionFormValues,
  CreateTransactionResponse,
  TransactionDetailResponse,
  BatchUpdateRequest,
} from "@/types/TransactionTypes";
import {
  createMergedTransactions,
  fetchTransactionHeaderById,
  updateTransactionDetail,
  batchUpdateTransactions,
} from "@/api/transactionApi";
import { fetchUserNestedAccessKeyByID } from "@/api/userApi";
import { NestedUserLocation, UserLoggedData } from "@/types/UserTypes";
import { getErrorMessage } from "@/utils/errorUtils";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const addModeValidationSchema = Yup.object().shape({
  location_ids: Yup.array()
    .of(Yup.number())
    .min(1, "At least one location is required"),
  trans_date: Yup.string().required("Transaction date is required"),
});

const editModeValidationSchema = Yup.object().shape({
  // No validation needed since trans_date is now readonly
});

const TransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const transactionId = state?.transactionId;
  const currentTabIndex = state?.currentTabIndex;
  const isEditMode = Boolean(transactionId);

  const [locations, setLocations] = useState<NestedUserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createResponse, setCreateResponse] = useState<
    CreateTransactionResponse[]
  >([]);
  const [transactionData, setTransactionData] =
    useState<TransactionDetailResponse | null>(null);
  const [editingDetails, setEditingDetails] = useState<{
    [key: string]: boolean;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [massUpdateDialogOpen, setMassUpdateDialogOpen] = useState(false);
  const [massUpdateType, setMassUpdateType] = useState<
    "rate" | "hurdle" | null
  >(null);
  const [massUpdateValue, setMassUpdateValue] = useState("");

  const { get, post, put } = useApi();
  const { enqueueSnackbar } = useSnackbar();
  const {
    fullUserData,
    canEditInModule,
    loading: permissionsLoading,
  } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;
  const hasEditPermission = canEditInModule("incentive-transactions");

  // Load locations for add mode
  useEffect(() => {
    const loadLocations = async () => {
      if (!isEditMode) {
        try {
          const userId = typedUserData?.user_id || 0;
          const response = await fetchUserNestedAccessKeyByID(
            { get },
            String(userId)
          );
          if (response && Array.isArray(response.locations)) {
            setLocations(response.locations.filter((l) => l.status_id === 1));
          }
        } catch (error) {
          setError(getErrorMessage(error, "Failed to load locations"));
        }
      }
    };
    loadLocations();
  }, [get, typedUserData, isEditMode]);

  // Load transaction data for edit mode
  useEffect(() => {
    const loadTransactionData = async () => {
      if (isEditMode && transactionId) {
        try {
          const response = await fetchTransactionHeaderById(
            { get },
            transactionId
          );
          if (response) {
            setTransactionData(response);
          }
        } catch (error) {
          setError(getErrorMessage(error, "Failed to load transaction data"));
        }
      }
    };
    loadTransactionData();
  }, [get, isEditMode, transactionId]);

  useEffect(() => {
    if (
      (!isEditMode && locations.length > 0) ||
      (isEditMode && transactionData)
    ) {
      setLoading(false);
    }
  }, [locations, transactionData, isEditMode]);

  const handleAddModeSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await createMergedTransactions({ post }, values);
      setCreateResponse(response);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to create transactions"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditModeSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Since trans_date is now readonly, we just navigate back
      // All individual field updates are handled by inline editing
      navigate("/transactions", {
        state: { currentTabIndex: currentTabIndex },
      });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update transaction"));
      enqueueSnackbar("Failed to update transaction", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailUpdate = async (
    detailId: string,
    field: string,
    value: string
  ) => {
    try {
      // Convert string to number for rate and ss_hurdle_qty fields
      let apiValue: string | number = value;
      if (field === "rate" || field === "ss_hurdle_qty") {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
          throw new Error(`Invalid ${field} value: must be a number`);
        }
        apiValue = numericValue;
      }

      await updateTransactionDetail({ put }, detailId, { [field]: apiValue });
      // Update local state - keep as number for calculations
      if (transactionData) {
        const updatedDetails = transactionData.details.map((detail) =>
          detail.details_id?.toString() === detailId
            ? { ...detail, [field]: apiValue }
            : detail
        );
        setTransactionData({
          ...transactionData,
          details: updatedDetails,
        });
      }
    } catch (error) {
      setError(getErrorMessage(error, `Failed to update ${field}`));
    }
  };

  const handleMassUpdateRate = async (newRate: string) => {
    if (!transactionData) return;

    try {
      // Validate that newRate is a valid number
      const numericRate = parseFloat(newRate);
      if (isNaN(numericRate)) {
        throw new Error("Invalid rate value: must be a number");
      }

      // Use batch update endpoint for better performance
      const batchUpdateData: BatchUpdateRequest = {
        detail_updates: [
          {
            transaction_header_id: transactionData.header.id,
            rate: numericRate,
          },
        ],
      };

      const response = await batchUpdateTransactions({ post }, batchUpdateData);

      if (response.detail_updates && response.detail_updates.length > 0) {
        const detailUpdate = response.detail_updates[0];
        enqueueSnackbar(
          `Rate updated successfully to ${detailUpdate.rate} for all transaction details`,
          { variant: "success" }
        );
      }

      // Update local state
      const updatedDetails = transactionData.details.map((detail) => ({
        ...detail,
        rate: numericRate,
      }));
      setTransactionData({
        ...transactionData,
        details: updatedDetails,
      });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update rates"));
      enqueueSnackbar("Failed to update rates", { variant: "error" });
    }
  };

  const handleMassUpdateHurdle = async (newHurdle: string) => {
    if (!transactionData) return;

    try {
      // Validate that newHurdle is a valid number
      const numericHurdle = parseFloat(newHurdle);
      if (isNaN(numericHurdle)) {
        throw new Error("Invalid hurdle quantity value: must be a number");
      }

      // Use batch update endpoint for better performance
      const batchUpdateData: BatchUpdateRequest = {
        detail_updates: [
          {
            transaction_header_id: transactionData.header.id,
            ss_hurdle_qty: numericHurdle,
          },
        ],
      };

      const response = await batchUpdateTransactions({ post }, batchUpdateData);

      if (response.detail_updates && response.detail_updates.length > 0) {
        const detailUpdate = response.detail_updates[0];
        enqueueSnackbar(
          `Hurdle quantity updated successfully to ${detailUpdate.ss_hurdle_qty} for all transaction details`,
          { variant: "success" }
        );
      }

      // Update local state
      const updatedDetails = transactionData.details.map((detail) => ({
        ...detail,
        ss_hurdle_qty: numericHurdle,
      }));
      setTransactionData({
        ...transactionData,
        details: updatedDetails,
      });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update hurdle quantities"));
      enqueueSnackbar("Failed to update hurdle quantities", {
        variant: "error",
      });
    }
  };

  const handleOpenMassUpdateDialog = (type: "rate" | "hurdle") => {
    setMassUpdateType(type);
    setMassUpdateValue("");
    setMassUpdateDialogOpen(true);
  };

  const handleCloseMassUpdateDialog = () => {
    setMassUpdateDialogOpen(false);
    setMassUpdateType(null);
    setMassUpdateValue("");
  };

  const handleConfirmMassUpdate = () => {
    if (!massUpdateValue.trim()) return;

    if (massUpdateType === "rate") {
      handleMassUpdateRate(massUpdateValue);
    } else if (massUpdateType === "hurdle") {
      handleMassUpdateHurdle(massUpdateValue);
    }

    handleCloseMassUpdateDialog();
  };

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({ value: Number(l.id), label: l.location_name })),
    [locations]
  );

  const filteredDetails = useMemo(() => {
    if (!transactionData?.details) return [];
    return transactionData.details.filter((detail) =>
      detail.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactionData?.details, searchTerm]);

  const calculateDifference = (hurdleQty: string, actualSales: string) => {
    return parseFloat(actualSales) - parseFloat(hurdleQty);
  };

  const calculateIncentive = (difference: number, rate: string) => {
    return difference > 0 ? difference * parseFloat(rate) : 0;
  };

  if (loading || permissionsLoading) {
    return <PageLoader modulename="Incentive Transactions" />;
  }

  if (!hasEditPermission) {
    return <NotAuthorized />;
  }

  if (error) {
    return (
      <Box m="0px 10px auto 10px">
        <Header
          title="TRANSACTION FORM"
          subtitle="Create or edit transactions"
        />
        <Typography color="error" variant="h6" mt={2}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title={isEditMode ? "EDIT TRANSACTION" : "CREATE TRANSACTION"}
        subtitle={
          isEditMode ? "Edit transaction details" : "Create new transactions"
        }
        actionButton={
          <Button
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              navigate("/transactions", {
                state: { currentTabIndex: currentTabIndex },
              })
            }
            sx={{ ml: 2 }}
          >
            Back to Transactions
          </Button>
        }
      />

      {!isEditMode ? (
        // Add Mode
        <Formik
          initialValues={{ location_ids: [], trans_date: "" }}
          validationSchema={addModeValidationSchema}
          onSubmit={handleAddModeSubmit}
        >
          {() => (
            <Form>
              <Box mt={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <InputMultiSelectField
                      name="location_ids"
                      label="Select Locations"
                      options={locationOptions}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InputMonthPickerField
                      name="trans_date"
                      label="Transaction Month"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={isSubmitting}
                      sx={{ mr: 2 }}
                    >
                      {isSubmitting ? "Creating..." : "Create Transactions"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() =>
                        navigate("/transactions", {
                          state: { currentTabIndex: currentTabIndex },
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Form>
          )}
        </Formik>
      ) : (
        // Edit Mode
        transactionData && (
          <Formik
            initialValues={{
              location_id: transactionData.header.location_id,
              location_name: transactionData.header.location_name,
              trans_date: transactionData.header.trans_date,
              details: transactionData.details,
            }}
            validationSchema={editModeValidationSchema}
            onSubmit={handleEditModeSubmit}
          >
            {({ values }) => (
              <Form>
                <Box mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Location"
                        value={values.location_name}
                        fullWidth
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Transaction Month"
                        value={new Date(values.trans_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )}
                        fullWidth
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>

                  {/* Details Table */}
                  <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                      Transaction Details
                    </Typography>

                    {/* Search and Mass Update Controls */}
                    <Box mb={2} display="flex" gap={2} alignItems="center">
                      <TextField
                        placeholder="Search by warehouse name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenMassUpdateDialog("rate")}
                      >
                        Mass Update Rate
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenMassUpdateDialog("hurdle")}
                      >
                        Mass Update Hurdle
                      </Button>
                    </Box>

                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Store</TableCell>
                            <TableCell>Budget Volume (Qrtr)</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell>Hurdle Qty</TableCell>
                            <TableCell>Actual Sales</TableCell>
                            <TableCell>Difference</TableCell>
                            <TableCell>Volume Target Reached</TableCell>
                            <TableCell>Incentive (SS Computation)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredDetails.map((detail) => {
                            const detailId =
                              detail.details_id?.toString() || "";
                            const difference = calculateDifference(
                              detail.ss_hurdle_qty.toString(),
                              detail.sales_qty.toString()
                            );
                            const incentive = calculateIncentive(
                              difference,
                              detail.rate.toString()
                            );

                            return (
                              <TableRow
                                key={detailId}
                                sx={{ "& td, & th": { py: 0.5, px: 1 } }}
                              >
                                <TableCell size="small">
                                  {detail.warehouse_name}
                                </TableCell>
                                <TableCell size="small">
                                  {detail.budget_volume}
                                </TableCell>
                                <TableCell size="small">
                                  {editingDetails[`${detailId}_rate`] ? (
                                    <TextField
                                      value={detail.rate}
                                      onChange={(e) => {
                                        const updatedDetails =
                                          transactionData.details.map((d) =>
                                            d.details_id?.toString() ===
                                            detailId
                                              ? { ...d, rate: +e.target.value }
                                              : d
                                          );
                                        setTransactionData({
                                          ...transactionData,
                                          details: updatedDetails,
                                        });
                                      }}
                                      onBlur={() => {
                                        setEditingDetails((prev) => ({
                                          ...prev,
                                          [`${detailId}_rate`]: false,
                                        }));
                                        handleDetailUpdate(
                                          detailId,
                                          "rate",
                                          detail.rate.toString()
                                        );
                                      }}
                                      size="small"
                                      autoFocus
                                      inputProps={{
                                        style: { fontSize: 13, padding: 4 },
                                      }}
                                    />
                                  ) : (
                                    <Box display="flex" alignItems="center">
                                      <Typography variant="body2">
                                        {detail.rate}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          setEditingDetails((prev) => ({
                                            ...prev,
                                            [`${detailId}_rate`]: true,
                                          }))
                                        }
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell size="small">
                                  {editingDetails[`${detailId}_hurdle`] ? (
                                    <TextField
                                      value={detail.ss_hurdle_qty}
                                      onChange={(e) => {
                                        const updatedDetails =
                                          transactionData.details.map((d) =>
                                            d.details_id?.toString() ===
                                            detailId
                                              ? {
                                                  ...d,
                                                  ss_hurdle_qty:
                                                    +e.target.value,
                                                }
                                              : d
                                          );
                                        setTransactionData({
                                          ...transactionData,
                                          details: updatedDetails,
                                        });
                                      }}
                                      onBlur={() => {
                                        setEditingDetails((prev) => ({
                                          ...prev,
                                          [`${detailId}_hurdle`]: false,
                                        }));
                                        handleDetailUpdate(
                                          detailId,
                                          "ss_hurdle_qty",
                                          detail.ss_hurdle_qty.toString()
                                        );
                                      }}
                                      size="small"
                                      autoFocus
                                      inputProps={{
                                        style: { fontSize: 13, padding: 4 },
                                      }}
                                    />
                                  ) : (
                                    <Box display="flex" alignItems="center">
                                      <Typography variant="body2">
                                        {detail.ss_hurdle_qty}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          setEditingDetails((prev) => ({
                                            ...prev,
                                            [`${detailId}_hurdle`]: true,
                                          }))
                                        }
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell size="small">
                                  <Typography variant="body2">
                                    {detail.sales_qty}
                                  </Typography>
                                </TableCell>
                                <TableCell size="small">
                                  <Typography
                                    variant="body2"
                                    color={
                                      difference > 0
                                        ? "success.main"
                                        : "error.main"
                                    }
                                  >
                                    {difference.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell size="small">
                                  <Chip
                                    label={difference > 0 ? "YES" : "NO"}
                                    color={difference > 0 ? "success" : "error"}
                                    variant="outlined"
                                    size="small"
                                    sx={{ fontSize: 12, height: 22 }}
                                  />
                                </TableCell>
                                <TableCell size="small">
                                  <Typography color="primary" variant="body2">
                                    {incentive.toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box mt={3} mb={4}>
                    {/* <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={isSubmitting}
                      sx={{ mr: 2 }}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button> */}
                    <Button
                      variant="outlined"
                      onClick={() =>
                        navigate("/transactions", {
                          state: { currentTabIndex: currentTabIndex },
                        })
                      }
                    >
                      Back to Transactions
                    </Button>
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        )
      )}

      {/* Create Response Display */}
      {createResponse.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Transaction Creation Results
          </Typography>
          <Grid container spacing={2}>
            {createResponse.map((result, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">
                        {result.location_name}
                      </Typography>
                      <Chip
                        label={result.status.toUpperCase()}
                        color={
                          result.status === "created" ? "success" : "warning"
                        }
                        variant="outlined"
                      />
                    </Box>
                    {result.status === "created" ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Header ID: {result.header_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Details Count: {result.details_count}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="warning.main">
                        {result.reason}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Mass Update Dialog */}
      <Dialog
        open={massUpdateDialogOpen}
        onClose={handleCloseMassUpdateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mass Update {massUpdateType === "rate" ? "Rate" : "Hurdle Quantity"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter the new{" "}
            {massUpdateType === "rate"
              ? "rate for all transaction details"
              : "hurdle quantity for all transaction details"}
            . This will update all existing details in the transaction.
          </Typography>
          <TextField
            label={
              massUpdateType === "rate" ? "New Rate" : "New Hurdle Quantity"
            }
            value={massUpdateValue}
            onChange={(e) => setMassUpdateValue(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {massUpdateType === "rate" ? "₱" : ""}
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMassUpdateDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmMassUpdate}
            color="secondary"
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionForm;
