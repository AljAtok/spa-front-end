import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  FilterList,
  Dashboard,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Formik, Form } from "formik";
// IMPORTANT: If you see errors like 'X cannot be used as a JSX component',
// you likely have a version mismatch between 'recharts' and '@types/recharts'.
// For recharts v2+, REMOVE '@types/recharts' from your dependencies (it is not needed).
// Make sure you are using 'recharts' v2 or later.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
// import CircularProgress from "@mui/material/CircularProgress";
// import { exportTableToPDF } from "../../utils/pdfExport";

// import FormHeader from "@/components/FormHeader";
import PageLoader from "@/components/PageLoader";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { fetchUserNestedAccessKeyByID } from "@/api/userApi";
import { IncentiveTransReportData } from "@/types/IncentiveTransReportTypes";
import { NestedUserLocation, UserLoggedData } from "@/types/UserTypes";
import { getErrorMessage } from "@/utils/errorUtils";
import { Header } from "@/components/Header";

interface StatusOption {
  value: number;
  label: string;
}

interface EmployeeIncentive {
  name: string;
  role: string;
  totalIncentives: number;
  storeCount: number;
}

interface ChartDataItem {
  location: string;
  totalSales: number;
  totalBudget: number;
  averageRate: number;
  averageIncentive: number;
  storeCount: number;
}

const STATUSES: StatusOption[] = [
  { value: 3, label: "PENDING" },
  { value: 4, label: "POSTED" },
  { value: 5, label: "CANCELLED" },
];

const IncentiveTransDashboard: React.FC = () => {
  const [data, setData] = useState<IncentiveTransReportData[]>([]);
  const [allData, setAllData] = useState<IncentiveTransReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<number | "">(4);
  const [locations, setLocations] = useState<NestedUserLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  // const [exportingPDF, setExportingPDF] = useState(false);
  const hasLoadedData = useRef(false);

  const { get } = useApi();
  const {
    fullUserData,
    canViewModule,
    loading: permissionsLoading,
  } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;
  const hasViewPermission = canViewModule("incentive-reports");

  // Load all data on component mount (no query params - backend handles permissions)
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      // Prevent multiple loads
      if (hasLoadedData.current || !isMounted || !hasViewPermission) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load all data with status_id=4 (POSTED) by default
        const url = `/dashboard?status_id=4`;
        const response = await get<IncentiveTransReportData[]>(url);
        const fetchedData = response || [];

        if (isMounted) {
          setAllData(fetchedData);
          setData(fetchedData); // Initially show all data
          hasLoadedData.current = true;
        }
      } catch (error) {
        if (isMounted) {
          setError(getErrorMessage(error, "Failed to load dashboard data"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (hasViewPermission && !hasLoadedData.current) {
      loadAllData();
    }

    return () => {
      isMounted = false;
    };
  }, [hasViewPermission, get]); // Use get directly instead of the hook function

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

  // Handle clearing filters and reload all data
  const handleClearFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reset filter states
      setSelectedLocations([]);
      setSelectedDate(null);
      setSelectedStatus("");

      // Reload all data without filters
      const url = `/transactions/report`;
      const response = await get<IncentiveTransReportData[]>(url);
      const fetchedData = response || [];

      setAllData(fetchedData);
      setData(fetchedData);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to reload data"));
    } finally {
      setLoading(false);
    }
  }, [get]);

  // Handle filter submission with API call
  const handleFilterSubmit = useCallback(
    async (locations: number[], date: Date | null, status: number | "") => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const queryParams = new URLSearchParams();

        if (locations.length > 0) {
          queryParams.append("location_ids", locations.join(","));
        }

        if (date) {
          // Format as first day of the month (YYYY-MM-01)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          queryParams.append("trans_date", `${year}-${month}-01`);
        }

        if (status !== "") {
          queryParams.append("status_id", status.toString());
        }

        // Make API call with filters
        const url = `/transactions/report${
          queryParams.toString() ? "?" + queryParams.toString() : ""
        }`;

        const response = await get<IncentiveTransReportData[]>(url);
        const fetchedData = response || [];

        setData(fetchedData);

        // Update state after successful API call
        setSelectedLocations(locations);
        setSelectedDate(date);
        setSelectedStatus(status);
      } catch (error) {
        setError(getErrorMessage(error, "Failed to fetch filtered data"));
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  // Prepare location options for InputMultiSelectField
  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({ value: Number(l.id), label: l.location_name })),
    [locations]
  );

  // Optimized chart data processing with memoization
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const locationMap = new Map<string, ChartDataItem>();

    data.forEach((item) => {
      const locationName = item.location_name;
      const sales = parseFloat(item.sales_qty) || 0;
      // const budget = parseFloat(item.budget_volume) || 0;
      const budget = parseFloat(item.budget_volume_monthly) || 0;
      const rate = parseFloat(item.rate) || 0;
      const hurdleQty = parseFloat(item.ss_hurdle_qty) || 0;

      // Calculate incentive for this item
      const difference = sales - hurdleQty;
      const incentive = difference > 0 ? difference * rate : 0;

      if (locationMap.has(locationName)) {
        const existing = locationMap.get(locationName)!;
        existing.totalSales += sales;
        existing.totalBudget += budget;
        existing.averageRate =
          (existing.averageRate * existing.storeCount + rate) /
          (existing.storeCount + 1);
        existing.averageIncentive =
          (existing.averageIncentive * existing.storeCount + incentive) /
          (existing.storeCount + 1);
        existing.storeCount += 1;
      } else {
        locationMap.set(locationName, {
          location: locationName,
          totalSales: sales,
          totalBudget: budget,
          averageRate: rate,
          averageIncentive: incentive,
          storeCount: 1,
        });
      }
    });

    return Array.from(locationMap.values());
  }, [data]);

  // Optimized employee incentives processing with memoization
  const employeeIncentives = useMemo(() => {
    if (data.length === 0) return [];

    const employees: EmployeeIncentive[] = [];
    const employeeMap = new Map<
      string,
      { totalIncentives: number; storeCount: number }
    >();

    data.forEach((item) => {
      const actualSales = parseFloat(item.sales_qty) || 0;
      const hurdleQty = parseFloat(item.ss_hurdle_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const difference = actualSales - hurdleQty;
      const incentive = difference > 0 ? difference * rate : 0;

      // Process each role if assigned
      const roles = [
        { name: item.assigned_ss_name, role: "SS" },
        { name: item.assigned_ah_name, role: "AH" },
        { name: item.assigned_bch_name, role: "BCH/GAH" },
        { name: item.assigned_gbch_name, role: "GBCH" },
        { name: item.assigned_rh_name, role: "RH" },
        { name: item.assigned_grh_name, role: "GRH" },
      ];

      roles.forEach(({ name, role }) => {
        if (name && name.trim()) {
          const key = `${name.trim()}_${role}`;
          const existing = employeeMap.get(key) || {
            totalIncentives: 0,
            storeCount: 0,
          };
          employeeMap.set(key, {
            totalIncentives: existing.totalIncentives + incentive,
            storeCount: existing.storeCount + 1,
          });
        }
      });
    });

    employeeMap.forEach((data, key) => {
      const [name, role] = key.split("_");
      employees.push({
        name: name,
        role: role,
        totalIncentives: data.totalIncentives,
        storeCount: data.storeCount,
      });
    });

    return employees.sort((a, b) => b.totalIncentives - a.totalIncentives);
  }, [data]);

  // Calculate max incentive for mini bar chart scaling
  const maxIncentive = useMemo(() => {
    return employeeIncentives.length > 0
      ? Math.max(...employeeIncentives.map((emp) => emp.totalIncentives))
      : 0;
  }, [employeeIncentives]);

  // Add color palette for doughnut charts
  const DOUGHNUT_COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

  // Data for doughnut charts
  const salesQtyDoughnutData = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((item) => ({
      name: item.location,
      value: item.totalSales,
    }));
  }, [chartData]);

  const budgetVolumeDoughnutData = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((item) => ({
      name: item.location,
      value: item.totalBudget,
    }));
  }, [chartData]);

  // Data for total incentives per location (line chart)
  const totalIncentivesLineData = useMemo(() => {
    if (data.length === 0) return [];
    const locationMap = new Map<string, number>();
    data.forEach((item) => {
      const location = item.location_name;
      const sales = parseFloat(item.sales_qty) || 0;
      const hurdle = parseFloat(item.ss_hurdle_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const incentive = sales - hurdle > 0 ? (sales - hurdle) * rate : 0;
      locationMap.set(location, (locationMap.get(location) || 0) + incentive);
    });
    return Array.from(locationMap.entries()).map(
      ([location, totalIncentive]) => ({
        location,
        totalIncentive,
      })
    );
  }, [data]);

  // Mini horizontal bar component
  const MiniHorizontalBar: React.FC<{
    value: number;
    maxValue: number;
    color?: string;
  }> = ({ value, maxValue, color = "#1976d2" }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    return (
      <Box sx={{ display: "flex", alignItems: "center", minWidth: 120 }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor: color,
              },
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
          >
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      </Box>
    );
  };

  // PDF export columns definition
  // const pdfColumns = [
  //   { title: "Location", field: "location_name" },
  //   { title: "Sales Qty", field: "sales_qty" },
  //   { title: "Budget Volume (Monthly)", field: "budget_volume_monthly" },
  //   { title: "Rate", field: "rate" },
  //   { title: "Hurdle Qty", field: "ss_hurdle_qty" },
  //   { title: "Assigned SS", field: "assigned_ss_name" },
  //   { title: "Assigned AH", field: "assigned_ah_name" },
  //   { title: "Assigned BCH/GAH", field: "assigned_bch_name" },
  //   { title: "Assigned GBCH", field: "assigned_gbch_name" },
  //   { title: "Assigned RH", field: "assigned_rh_name" },
  //   { title: "Assigned GRH", field: "assigned_grh_name" },
  // ];
  // const handleExportPDF = async () => {
  //   setExportingPDF(true);
  //   try {
  //     await exportTableToPDF({
  //       data,
  //       columns: pdfColumns,
  //       fileName: "Incentive-Transactions-Dashboard.pdf",
  //       title: "Incentive Transactions Dashboard Report",
  //     });
  //   } finally {
  //     setExportingPDF(false);
  //   }
  // };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {permissionsLoading ? (
        <PageLoader />
      ) : !hasViewPermission ? (
        <NotAuthorized />
      ) : (
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Header title="Dashboard" subtitle="" />
            {/* <Button
              variant="outlined"
              color="primary"
              onClick={handleExportPDF}
              disabled={data.length === 0 || exportingPDF}
              startIcon={exportingPDF ? <CircularProgress size={18} /> : undefined}
            >
              {exportingPDF ? "Exporting..." : "Export to PDF"}
            </Button> */}
          </Box>

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
                            setFieldValue("location_ids", []);
                            setFieldValue("trans_date", null);
                            setFieldValue("status_id", "");
                            handleClearFilters();
                          }}
                          disabled={loading}
                        >
                          Clear Filters
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Dashboard />}
                          onClick={() => {
                            handleFilterSubmit(
                              values.location_ids,
                              values.trans_date,
                              values.status_id
                            );
                          }}
                          disabled={loading}
                        >
                          Apply Filters
                        </Button>
                      </Box>
                    </Form>
                  )}
                </Formik>
              </Collapse>
            </CardContent>
          </Card>

          {/* Dashboard Charts */}
          {data.length > 0 && (
            <>
              {/* Sales vs Budget Bar Chart */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sales vs Budget by Location
                  </Typography>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="totalSales"
                          fill="#8884d8"
                          name="Total Sales"
                        />
                        <Bar
                          dataKey="totalBudget"
                          fill="#82ca9d"
                          name="Total Budget"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Average Rate Line Chart */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Rate by Location
                  </Typography>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [
                            `₱${Number(value).toFixed(2)}`,
                            "Average Rate",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="averageRate"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Average Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Average Incentive Line Chart */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Incentive by Location
                  </Typography>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [
                            `₱${Number(value).toFixed(2)}`,
                            "Average Incentive",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="averageIncentive"
                          stroke="#ff7300"
                          strokeWidth={2}
                          name="Average Incentive"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Doughnut Charts: Total Sales Qty & Total Budget Volume Per Location (side by side) */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Sales Qty Per Location
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          alignItems: "center",
                          justifyContent: "center",
                          height: 350,
                        }}
                      >
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart>
                            <Pie
                              data={salesQtyDoughnutData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              label={false}
                            >
                              {salesQtyDoughnutData.map((_, idx) => (
                                <Cell
                                  key={`cell-sales-${idx}`}
                                  fill={
                                    DOUGHNUT_COLORS[
                                      idx % DOUGHNUT_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <Box
                          sx={{ ml: { md: 3, xs: 0 }, mt: { xs: 2, md: 0 } }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            Location Breakdown
                          </Typography>
                          {salesQtyDoughnutData.map((entry, idx) => {
                            const total = salesQtyDoughnutData.reduce(
                              (sum, d) => sum + d.value,
                              0
                            );
                            const percent =
                              total > 0 ? (entry.value / total) * 100 : 0;
                            return (
                              <Box
                                key={entry.name}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    bgcolor:
                                      DOUGHNUT_COLORS[
                                        idx % DOUGHNUT_COLORS.length
                                      ],
                                    borderRadius: "50%",
                                    mr: 1,
                                  }}
                                />
                                <Typography variant="body2">
                                  {entry.name}:{" "}
                                  {entry.value.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  ({percent.toFixed(1)}%)
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography variant="subtitle1">
                          Total Sales Qty:{" "}
                          {salesQtyDoughnutData
                            .reduce((sum, d) => sum + d.value, 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Budget Volume (Monthly) Per Location
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          alignItems: "center",
                          justifyContent: "center",
                          height: 350,
                        }}
                      >
                        <ResponsiveContainer width={220} height={220}>
                          <PieChart>
                            <Pie
                              data={budgetVolumeDoughnutData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              label={false}
                            >
                              {budgetVolumeDoughnutData.map((_, idx) => (
                                <Cell
                                  key={`cell-budget-${idx}`}
                                  fill={
                                    DOUGHNUT_COLORS[
                                      idx % DOUGHNUT_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <Box
                          sx={{ ml: { md: 3, xs: 0 }, mt: { xs: 2, md: 0 } }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            Location Breakdown
                          </Typography>
                          {budgetVolumeDoughnutData.map((entry, idx) => {
                            const total = budgetVolumeDoughnutData.reduce(
                              (sum, d) => sum + d.value,
                              0
                            );
                            const percent =
                              total > 0 ? (entry.value / total) * 100 : 0;
                            return (
                              <Box
                                key={entry.name}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    bgcolor:
                                      DOUGHNUT_COLORS[
                                        idx % DOUGHNUT_COLORS.length
                                      ],
                                    borderRadius: "50%",
                                    mr: 1,
                                  }}
                                />
                                <Typography variant="body2">
                                  {entry.name}:{" "}
                                  {entry.value.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  ({percent.toFixed(1)}%)
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography variant="subtitle1">
                          Total Budget Volume:{" "}
                          {budgetVolumeDoughnutData
                            .reduce((sum, d) => sum + d.value, 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Line Chart: Total Incentives Per Location */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Incentives Per Location
                  </Typography>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={totalIncentivesLineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [
                            `₱${Number(value).toFixed(2)}`,
                            "Total Incentive",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalIncentive"
                          stroke="#1976d2"
                          strokeWidth={2}
                          name="Total Incentive"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Employee Incentives Table */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Employee Personnel & Total Incentives
                  </Typography>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee Name</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell align="right">Total Incentives</TableCell>
                          <TableCell align="center" sx={{ minWidth: 180 }}>
                            Performance Bar
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employeeIncentives.map((employee, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {employee.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {employee.role}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                ₱{employee.totalIncentives.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <MiniHorizontalBar
                                value={employee.totalIncentives}
                                maxValue={maxIncentive}
                                color={
                                  index === 0
                                    ? "#4caf50" // Green for top performer
                                    : index < 3
                                    ? "#2196f3" // Blue for top 3
                                    : "#ff9800" // Orange for others
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {employeeIncentives.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              align="center"
                              sx={{ py: 4, color: "text.secondary" }}
                            >
                              No employee data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* No Data Message */}
          {data.length === 0 && !loading && (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Dashboard sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No Data Available
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {allData.length === 0
                      ? "No transaction data found for your access permissions"
                      : "No data matches the current filter criteria"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <PageLoader />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 2 }}
                  >
                    Loading dashboard data...
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </LocalizationProvider>
  );
};

export default IncentiveTransDashboard;
