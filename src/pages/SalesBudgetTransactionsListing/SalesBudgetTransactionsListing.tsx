import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Button, TextField, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Visibility, Upload, FileDownload } from "@mui/icons-material";
import { Header } from "../../components/Header";

import { SalesBudgetTransaction } from "../../types/SalesBudgetTransactionTypes";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import HeaderActionButton from "../../components/HeaderActionButton";
import { exportJsonToExcel } from "../../utils/excelExport";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  {
    field: "location_name",
    headerName: "Location",
    flex: 1.5,
    cellClassName: "name-column--cell",
  },
  {
    field: "month",
    headerName: "Month",
    flex: 1,
  },
  {
    field: "num_stores",
    headerName: "Number of Stores",
    flex: 1,
    type: "number",
  },
  {
    field: "budget_volume",
    headerName: "Budget Volume",
    flex: 1.2,
    type: "number",
  },
  {
    field: "status_name",
    headerName: "Status",
    flex: 0.8,
    renderer: "statusName",
  },
];

const mobileHiddenBudgetFields = ["num_stores", "budget_volume"];
const nonMobileHiddenBudgetFields = [""];

const SalesBudgetTransactionsListing: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<SalesBudgetTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);
  const apiInstance = useApi();
  const { get } = apiInstance;

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("sales-budget-transactions");

  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default year picker

  const yearOptions = Array.from({ length: 10 }, (_, i) => 2024 + i);

  const monthLabels = useMemo(() => {
    return {
      "01": "January",
      "02": "February",
      "03": "March",
      "04": "April",
      "05": "May",
      "06": "June",
      "07": "July",
      "08": "August",
      "09": "September",
      "10": "October",
      "11": "November",
      "12": "December",
    };
  }, []);

  const loadSalesBudgetTransactionsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<SalesBudgetTransaction[]>(
        `/sales-budget-transactions/per-location?sales_year=${selectedYear}`
      );
      if (response) {
        const transactions = Array.isArray(response) ? response : [response];
        setDataRows(
          transactions.map(
            (transaction: SalesBudgetTransaction, index: number) => ({
              ...transaction,
              id: `${transaction.location_id}-${index}`,
              location_name: transaction.location_name || "",
              month: transaction.month || "",
              num_stores: transaction.num_stores || 0,
              budget_volume: transaction.budget_volume || 0,
              status_name: transaction.status_name || "INACTIVE",
            })
          )
        );
      }
    } catch (error) {
      console.error("Error loading sales budget transactions:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get, selectedYear]);

  useEffect(() => {
    loadSalesBudgetTransactionsData();
  }, [loadSalesBudgetTransactionsData]);

  const handleView = useCallback(
    (id: string | number, rowData: SalesBudgetTransaction) => {
      console.log(
        `View Sales Budget Transaction with ID:`,
        id,
        `Data:`,
        rowData
      );
      // Format sales_date to YYYY-MM-DD format
      const salesDate = new Date(rowData.sales_date)
        .toISOString()
        .split("T")[0];
      navigate("/sales-budget-transactions/view", {
        state: {
          location_id: rowData.location_id,
          sales_date: salesDate,
          location_name: rowData.location_name,
          month: rowData.month,
        },
      });
    },
    [navigate]
  );

  const handleExportToExcel = useCallback(async () => {
    setExporting(true);
    try {
      const response = await get<SalesBudgetTransaction[]>(
        `/sales-budget-transactions?sales_year=${selectedYear}`
      );
      if (response && Array.isArray(response)) {
        const exportData = response.map((item) => {
          // Format month as 'Month YYYY' from sales_date
          let budgetMonth = "";
          if (item.sales_date) {
            const [year, month] = String(item.sales_date).split("-");
            budgetMonth = `${
              monthLabels[month as keyof typeof monthLabels] || month
            } ${year}`;
          }
          return {
            BC: String(item.bc_name ?? ""),
            "BC Name": String(item.bc_code ?? ""),
            "Store IFS": String(item.ifs_code ?? ""),
            "Store Name": String(item.outlet_name ?? ""),
            "Budget Volume": String(item.sales_det_qty_2 ?? ""),
            "Budget Month": budgetMonth,
            "Material Code": String(item.material_code ?? ""),
            "Material Desc": String(item.material_desc ?? ""),
            "Material Group Name": String(item.material_group_name ?? ""),
          };
        });
        exportJsonToExcel(
          exportData,
          `sales-budget-transactions-${selectedYear}.xlsx`
        );
      } else {
        alert("No data to export");
      }
    } catch (error) {
      alert("Failed to export data.");
      console.error("Export to Excel error:", error);
    } finally {
      setExporting(false);
    }
  }, [get, selectedYear, monthLabels]);

  const handleUpload = useCallback(() => {
    console.log("Navigate to Upload Sales Budget Transactions");
    navigate("/sales-budget-transactions/upload");
  }, [navigate]);

  const columns: GridColDef<SalesBudgetTransaction>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<SalesBudgetTransaction>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 0.8,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<SalesBudgetTransaction>) => {
          if (!params.row) return null;
          const rowData = params.row;

          return (
            <DatagridActions<SalesBudgetTransaction>
              rowId={rowData.id}
              actions={[
                {
                  type: "view",
                  icon: Visibility,
                  onClick: () => handleView(rowData.id, rowData),
                  tooltip: "View Sales Budget Transaction",
                  ariaLabel: "View Sales Budget Transaction",
                },
              ]}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [handleView]);

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Sales Budget Transactions" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="SALES BUDGET TRANSACTIONS"
        subtitle="View sales budget transactions per location"
        actionButton={
          <>
            <TextField
              select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="small"
              sx={{ width: 120, mr: 2 }}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
            <HeaderActionButton
              moduleAlias="sales-budget-transactions"
              onClick={handleUpload}
              icon={Upload}
              text="Upload"
            />
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExportToExcel}
              color="secondary"
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </>
        }
      />
      <CustomDataGrid<SalesBudgetTransaction>
        rows={dataRows}
        columns={columns}
        getRowId={(row: SalesBudgetTransaction) => row.id}
        initialMobileHiddenFields={mobileHiddenBudgetFields}
        initialNonMobileHiddenFields={nonMobileHiddenBudgetFields}
      />
    </Box>
  );
};

export default SalesBudgetTransactionsListing;
