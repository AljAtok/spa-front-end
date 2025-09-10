import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Divider,
  Grid,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import {
  ExpandMore,
  ExpandLess,
  FilterList,
  FileDownload,
  Search,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Formik, Form } from "formik";
import * as XLSX from "xlsx";
import { format, getQuarter, getMonth } from "date-fns";

import FormHeader from "@/components/FormHeader";
import PageLoader from "@/components/PageLoader";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useIncentiveTransReportApi } from "@/api/incentiveTransReportApi";
import { fetchUserNestedAccessKeyByID } from "@/api/userApi";
import {
  IncentiveTransReportData,
  IncentiveTransReportRow,
  IncentiveTransReportParams,
} from "@/types/IncentiveTransReportTypes";
import { NestedUserLocation, UserLoggedData } from "@/types/UserTypes";
import { getErrorMessage } from "@/utils/errorUtils";

interface StatusOption {
  value: number;
  label: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Mock data for locations and statuses
const STATUSES: StatusOption[] = [
  //   { value: 1, label: "DRAFT" },
  { value: 3, label: "PENDING" },
  //   { value: 3, label: "APPROVED" },
  { value: 4, label: "POSTED" },
  { value: 5, label: "CANCELLED" },
];

const IncentiveTransReport: React.FC = () => {
  const [data, setData] = useState<IncentiveTransReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<number | "">("");
  const [locations, setLocations] = useState<NestedUserLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const { get } = useApi();
  const { getIncentiveTransReport } = useIncentiveTransReportApi();
  const {
    fullUserData,
    canViewModule,
    loading: permissionsLoading,
  } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;
  const hasViewPermission = canViewModule("incentive-reports");

  // Load user's allowed locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
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
      } finally {
        setLocationsLoading(false);
      }
    };

    if (typedUserData?.user_id) {
      loadLocations();
    }
  }, [get, typedUserData]);

  // Transform raw data to report format
  const transformData = useCallback(
    (rawData: IncentiveTransReportData[]): IncentiveTransReportRow[] => {
      return rawData.map((item) => {
        const transDate = new Date(item.trans_date);
        const budgetVolume = parseFloat(item.budget_volume);
        const actualSales = parseFloat(item.sales_qty);
        const hurdleQty = parseFloat(item.ss_hurdle_qty);
        const rate = parseFloat(item.rate);
        const difference = actualSales - hurdleQty;
        const incentives = difference > 0 ? difference * rate : 0;

        return {
          detail_id: item.detail_id,
          year: item.trans_year,
          quarter: getQuarter(transDate),
          monthNo: getMonth(transDate) + 1,
          month: MONTH_NAMES[getMonth(transDate)],
          region: item.region_name,
          businessCenter: item.location_name,
          storeIfs: item.warehouse_ifs,
          storeName: item.warehouse_name,
          budgetVolume,
          hurdleQty,
          actualSales,
          rate,
          difference,
          volumeTargetReached: difference > 0 ? "YES" : "NO",
          incentives,
          assignedSs: item.assigned_ss_name || "",
          assignedAh: item.assigned_ah_name || "",
          assignedBchGah: item.assigned_bch_name || "",
          assignedGbch: item.assigned_gbch_name || "",
          assignedRh: item.assigned_rh_name || "",
          assignedGrh: item.assigned_grh_name || "",
          transNumber: item.trans_number,
          transDate: item.trans_date,
          statusName: item.status_name,
        };
      });
    },
    []
  );

  // Handle filter submission
  const handleFilterSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: IncentiveTransReportParams = {};

      if (selectedLocations.length > 0) {
        params.location_ids = selectedLocations.join(",");
      }
      if (selectedDate) {
        // Format as first day of the selected month (YYYY-MM-01)
        const firstDayOfMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        params.trans_date = format(firstDayOfMonth, "yyyy-MM-dd");
      }
      if (selectedStatus !== "") {
        params.status_id = selectedStatus.toString();
      }

      const rawData = await getIncentiveTransReport(params);
      const transformedData = transformData(rawData);
      setData(transformedData);
      setFiltersOpen(false);
    } catch (err) {
      setError("Failed to load report data. Please try again.");
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  }, [
    selectedLocations,
    selectedDate,
    selectedStatus,
    getIncentiveTransReport,
    transformData,
  ]);

  // Handle Excel export
  const handleExportToExcel = useCallback(() => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = data.map((row) => ({
      YEAR: row.year,
      QUARTER: row.quarter,
      "MONTH NO": row.monthNo,
      MONTH: row.month,
      REGION: row.region,
      "BUSINESS CENTER": row.businessCenter,
      "STORE IFS": row.storeIfs,
      "STORE NAME": row.storeName,
      "BUDGET VOLUME": row.budgetVolume,
      "HURDLE QTY": row.hurdleQty,
      "ACTUAL SALES": row.actualSales,
      RATE: row.rate,
      DIFFERENCE: row.difference,
      "VOLUME TARGET REACHED?": row.volumeTargetReached,
      "INCENTIVES (SS COMPUTATION)": row.incentives,
      "ASSIGNED SS": row.assignedSs,
      "ASSIGNED AH": row.assignedAh,
      "ASSIGNED BCH/GAH": row.assignedBchGah,
      "ASSIGNED GBCH": row.assignedGbch,
      "ASSIGNED RH": row.assignedRh,
      "ASSIGNED GRH": row.assignedGrh,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incentive Trans Report");

    const fileName = `incentive-trans-report-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [data]);

  // Prepare location options for InputMultiSelectField
  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({ value: Number(l.id), label: l.location_name })),
    [locations]
  );

  // Column definitions for DataGrid
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "year", headerName: "YEAR", width: 80 },
      { field: "quarter", headerName: "QUARTER", width: 90, type: "number" },
      { field: "monthNo", headerName: "MONTH NO", width: 100, type: "number" },
      { field: "month", headerName: "MONTH", width: 120 },
      { field: "region", headerName: "REGION", width: 150 },
      { field: "businessCenter", headerName: "BUSINESS CENTER", width: 150 },
      { field: "storeIfs", headerName: "STORE IFS", width: 120 },
      { field: "storeName", headerName: "STORE NAME", width: 200 },
      {
        field: "budgetVolume",
        headerName: "BUDGET VOLUME",
        width: 130,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
      },
      {
        field: "hurdleQty",
        headerName: "HURDLE QTY",
        width: 120,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
      },
      {
        field: "actualSales",
        headerName: "ACTUAL SALES",
        width: 130,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
      },
      {
        field: "rate",
        headerName: "RATE",
        width: 80,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
      },
      {
        field: "difference",
        headerName: "DIFFERENCE",
        width: 120,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={parseFloat(params.value).toFixed(2)}
            color={params.value > 0 ? "success" : "error"}
            size="small"
          />
        ),
      },
      {
        field: "volumeTargetReached",
        headerName: "VOLUME TARGET REACHED?",
        width: 180,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value}
            color={params.value === "YES" ? "success" : "error"}
            size="small"
          />
        ),
      },
      {
        field: "incentives",
        headerName: "INCENTIVES (SS COMPUTATION)",
        width: 200,
        type: "number",
        valueFormatter: (value: number) => value?.toFixed(2) || "0.00",
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{ color: params.value > 0 ? "success.main" : "text.secondary" }}
          >
            {parseFloat(params.value).toFixed(2)}
          </Box>
        ),
      },
      { field: "assignedSs", headerName: "ASSIGNED SS", width: 150 },
      { field: "assignedAh", headerName: "ASSIGNED AH", width: 150 },
      { field: "assignedBchGah", headerName: "ASSIGNED BCH/GAH", width: 150 },
      { field: "assignedGbch", headerName: "ASSIGNED GBCH", width: 150 },
      { field: "assignedRh", headerName: "ASSIGNED RH", width: 150 },
      { field: "assignedGrh", headerName: "ASSIGNED GRH", width: 150 },
    ],
    []
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {permissionsLoading ? (
        <PageLoader />
      ) : !hasViewPermission ? (
        <NotAuthorized />
      ) : (
        <Box sx={{ p: 3 }}>
          <FormHeader title="Incentive Transaction Report" />

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading Alert for Locations */}
          {locationsLoading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading user locations...
            </Alert>
          )}

          {/* Filter Panel */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <FilterList sx={{ mr: 1 }} />
                  <Typography variant="h6">Filters</Typography>
                </Box>
                <IconButton onClick={() => setFiltersOpen(!filtersOpen)}>
                  {filtersOpen ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={filtersOpen}>
                <Divider sx={{ my: 2 }} />
                <Formik
                  initialValues={{
                    location_ids: selectedLocations,
                    trans_date: selectedDate,
                    status_id: selectedStatus,
                  }}
                  onSubmit={(values) => {
                    setSelectedLocations(values.location_ids);
                    setSelectedDate(values.trans_date);
                    setSelectedStatus(values.status_id);
                  }}
                  enableReinitialize
                >
                  {({ values, setFieldValue }) => (
                    <Form>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <InputMultiSelectField
                            name="location_ids"
                            label="Locations"
                            options={locationOptions}
                            disabled={locationsLoading}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <DatePicker
                            views={["year", "month"]}
                            label="Transaction Month"
                            value={values.trans_date}
                            onChange={(date) =>
                              setFieldValue("trans_date", date)
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={values.status_id}
                              onChange={(e) =>
                                setFieldValue("status_id", e.target.value)
                              }
                              label="Status"
                            >
                              <MenuItem value="">All</MenuItem>
                              {STATUSES.map((status) => (
                                <MenuItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                          mt: 3,
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSelectedLocations([]);
                            setSelectedDate(null);
                            setSelectedStatus("");
                            setFieldValue("location_ids", []);
                            setFieldValue("trans_date", null);
                            setFieldValue("status_id", "");
                          }}
                        >
                          Clear Filters
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Search />}
                          onClick={() => {
                            setSelectedLocations(values.location_ids);
                            setSelectedDate(values.trans_date);
                            setSelectedStatus(values.status_id);
                            handleFilterSubmit();
                          }}
                          disabled={loading}
                        >
                          {loading ? "Loading..." : "Generate Report"}
                        </Button>
                      </Box>
                    </Form>
                  )}
                </Formik>
              </Collapse>
            </CardContent>
          </Card>

          {/* Data Grid */}
          <Card>
            <CardContent>
              {/* Export Button */}
              {data.length > 0 && (
                <Box
                  sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    variant="contained"
                    startIcon={<FileDownload />}
                    onClick={handleExportToExcel}
                    color="secondary"
                    disabled={data.length === 0}
                  >
                    Export to Excel
                  </Button>
                </Box>
              )}

              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={data}
                  columns={columns}
                  density="compact"
                  getRowId={(row) => row.detail_id}
                  loading={loading}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 25 },
                    },
                  }}
                  slots={{
                    toolbar: () => (
                      <GridToolbarContainer>
                        <GridToolbarColumnsButton />
                        <GridToolbarFilterButton />
                        <GridToolbarDensitySelector />
                        <GridToolbarExport />
                      </GridToolbarContainer>
                    ),
                  }}
                  sx={{
                    "& .MuiDataGrid-root": {
                      border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid rgba(224, 224, 224, 1)",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      borderBottom: "1px solid rgba(224, 224, 224, 1)",
                      fontWeight: "bold",
                    },
                    "& .MuiDataGrid-toolbarContainer": {
                      padding: "8px",
                      borderBottom: "1px solid rgba(224, 224, 224, 1)",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </LocalizationProvider>
  );
};

export default IncentiveTransReport;
