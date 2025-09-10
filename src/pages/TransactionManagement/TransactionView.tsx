import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from "@mui/material";
import { Search, FileDownload } from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Header } from "@/components/Header";
import PageLoader from "@/components/PageLoader";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import { TransactionDetailResponse } from "@/types/TransactionTypes";
import { fetchTransactionHeaderById } from "@/api/transactionApi";
import { getErrorMessage } from "@/utils/errorUtils";
import * as XLSX from "xlsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const TransactionView: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const transactionId = state?.transactionId;
  const transactionNumber = state?.transactionNumber;
  const currentTabIndex = state?.currentTabIndex;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] =
    useState<TransactionDetailResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { get } = useApi();
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("incentive-transactions");

  // Load transaction data
  useEffect(() => {
    const loadTransactionData = async () => {
      if (transactionId) {
        try {
          const response = await fetchTransactionHeaderById(
            { get },
            transactionId
          );
          if (response) {
            setTransactionData(response);
          } else {
            setError("Transaction not found");
          }
        } catch (error) {
          setError(getErrorMessage(error, "Failed to load transaction data"));
        }
      } else {
        setError("No transaction ID provided");
      }
      setLoading(false);
    };
    loadTransactionData();
  }, [get, transactionId]);

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

  const handleExportToExcel = () => {
    if (!transactionData) return;

    const exportData = filteredDetails.map((detail) => {
      const difference = calculateDifference(
        detail.ss_hurdle_qty.toString(),
        detail.sales_qty.toString()
      );
      const incentive = calculateIncentive(difference, detail.rate.toString());

      return {
        Store: detail.warehouse_name,
        "Budget Volume": detail.budget_volume,
        Rate: detail.rate,
        "Hurdle Qty": detail.ss_hurdle_qty,
        "Actual Sales": detail.sales_qty,
        Difference: difference.toFixed(2),
        "Volume Target Reached": difference > 0 ? "Yes" : "No",
        "Incentive (SS Computation)": incentive.toFixed(2),
      };
    });

    const workbook = XLSX.utils.book_new();

    // Add header information
    const headerInfo = [
      ["Transaction Details"],
      [""],
      ["Location:", transactionData.header.location_name],
      ["Transaction #:", transactionNumber],
      [
        "Transaction Month:",
        new Date(transactionData.header.trans_date).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
          }
        ),
      ],
      ["Status:", transactionData.header.status_name || "Unknown"],
      [""],
      ["Transaction Details:"],
      [""],
    ];

    // Create a new worksheet with header info and data
    const finalData = [
      ...headerInfo,
      Object.keys(exportData[0] || {}),
      ...exportData.map((row) => Object.values(row)),
    ];

    const finalWorksheet = XLSX.utils.aoa_to_sheet(finalData);
    XLSX.utils.book_append_sheet(
      workbook,
      finalWorksheet,
      "Transaction Details"
    );

    // Download the file
    const fileName = `Transaction_${transactionNumber}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading || permissionsLoading) {
    return <PageLoader modulename="Incentive Transactions" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  if (error) {
    return (
      <Box m="0px 10px auto 10px">
        <Header title="TRANSACTION VIEW" subtitle="View transaction details" />
        <Typography color="error" variant="h6" mt={2}>
          {error}
        </Typography>
        <Button
          variant="outlined"
          onClick={() =>
            navigate("/transactions", {
              state: { currentTabIndex: currentTabIndex },
            })
          }
          sx={{ mt: 2 }}
        >
          Back to Transactions
        </Button>
      </Box>
    );
  }

  if (!transactionData) {
    return (
      <Box m="0px 10px auto 10px">
        <Header title="TRANSACTION VIEW" subtitle="View transaction details" />
        <Typography variant="h6" mt={2}>
          No transaction data available
        </Typography>
        <Button
          variant="outlined"
          onClick={() =>
            navigate("/transactions", {
              state: { currentTabIndex: currentTabIndex },
            })
          }
          sx={{ mt: 2 }}
        >
          Back to Transactions
        </Button>
      </Box>
    );
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="TRANSACTION VIEW"
        subtitle="View transaction details"
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

      <Box mt={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Location"
              value={transactionData.header.location_name}
              fullWidth
              disabled
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Transaction Month"
              value={new Date(
                transactionData.header.trans_date
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
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

          {/* Search and Export Controls */}
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
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExportToExcel}
              color="secondary"
            >
              Export to Excel
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell size="small">Store</TableCell>
                  <TableCell size="small">Budget Volume (Qrtr)</TableCell>
                  <TableCell size="small">Rate</TableCell>
                  <TableCell size="small">Hurdle Qty</TableCell>
                  <TableCell size="small">Actual Sales</TableCell>
                  <TableCell size="small">Difference</TableCell>
                  <TableCell size="small">Volume Target Reached</TableCell>
                  <TableCell size="small">Incentive (SS Computation)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDetails.map((detail) => {
                  const detailId = detail.details_id?.toString() || "";
                  const difference = calculateDifference(
                    detail.ss_hurdle_qty.toString(),
                    detail.sales_qty.toString()
                  );
                  const incentive = calculateIncentive(
                    difference,
                    detail.rate.toString()
                  );

                  return (
                    <TableRow key={detailId}>
                      <TableCell size="small">
                        {detail.warehouse_name}
                      </TableCell>
                      <TableCell size="small">{detail.budget_volume}</TableCell>
                      <TableCell size="small">{detail.rate}</TableCell>
                      <TableCell size="small">{detail.ss_hurdle_qty}</TableCell>
                      <TableCell size="small">
                        {parseFloat(detail.sales_qty.toString()).toFixed(3)}
                      </TableCell>
                      <TableCell size="small">
                        {difference.toFixed(2)}
                      </TableCell>
                      <TableCell size="small">
                        {difference > 0 ? "Yes" : "No"}
                      </TableCell>
                      <TableCell size="small">{incentive.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredDetails.length === 0 && (
                  <TableRow>
                    <TableCell size="small" colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No transaction details found
                        {searchTerm && ` matching "${searchTerm}"`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Action Buttons */}
        <Box mt={3} mb={5} display="flex" gap={2}>
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
          {/* <Button
            variant="contained"
            onClick={() =>
              navigate("/transaction-form", { state: { transactionId } })
            }
            color="primary"
          >
            Edit Transaction
          </Button> */}
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionView;
