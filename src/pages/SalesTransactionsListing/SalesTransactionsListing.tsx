import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Button, TextField, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Visibility, FileDownload } from "@mui/icons-material";
import { Header } from "../../components/Header";

import { SalesTransaction } from "../../types/SalesTransactionTypes";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import { exportJsonToExcel } from "../../utils/excelExport";

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
    field: "gross_sales",
    headerName: "Gross Sales",
    flex: 1.2,
    type: "number",
  },
  {
    field: "net_sales",
    headerName: "Net Sales",
    flex: 1.2,
    type: "number",
  },
  {
    field: "total_sales_qty",
    headerName: "Total Sales Qty",
    flex: 1,
    type: "number",
  },
  {
    field: "status_name",
    headerName: "Status",
    flex: 0.8,
    renderer: "statusName",
  },
];

const mobileHiddenSalesFields = ["num_stores", "gross_sales"];
const nonMobileHiddenSalesFields = [""];

const SalesTransactionsListing: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<SalesTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);
  const apiInstance = useApi();
  const { get } = apiInstance;

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("sales-transactions");

  const [selectedMonth, setSelectedMonth] = useState<string>("2025-05-01");

  const monthOptions = [
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
    "2025-06-01",
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
    "2025-10-01",
    "2025-11-01",
    "2025-12-01",
  ];

  const monthLabels = useMemo(
    () => ({
      "2025-01-01": "January 2025",
      "2025-02-01": "February 2025",
      "2025-03-01": "March 2025",
      "2025-04-01": "April 2025",
      "2025-05-01": "May 2025",
      "2025-06-01": "June 2025",
      "2025-07-01": "July 2025",
      "2025-08-01": "August 2025",
      "2025-09-01": "September 2025",
      "2025-10-01": "October 2025",
      "2025-11-01": "November 2025",
      "2025-12-01": "December 2025",
    }),
    []
  );

  const loadSalesTransactionsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<SalesTransaction[]>(
        `/sales-transactions/per-location?sales_date=${selectedMonth}`
      );
      if (response) {
        const transactions = Array.isArray(response) ? response : [response];
        setDataRows(
          transactions.map((transaction: SalesTransaction, index: number) => ({
            ...transaction,
            id: `${transaction.location_id}-${index}`, // Create unique ID using location_id and index
            location_name: transaction.location_name || "",
            month: transaction.month || "",
            num_stores: transaction.num_stores || 0,
            gross_sales: transaction.gross_sales || 0,
            net_sales: transaction.net_sales || 0,
            total_sales_qty: transaction.total_sales_qty || 0,
            status_name: transaction.status_name || "INACTIVE",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading sales transactions:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get, selectedMonth]);

  useEffect(() => {
    loadSalesTransactionsData();
  }, [loadSalesTransactionsData]);

  const handleView = useCallback(
    (id: string | number, rowData: SalesTransaction) => {
      console.log(
        `View Sales Transaction with ID:`,
        id,
        `Data:`,
        rowData,
        "Date:",
        rowData.sales_date
      );
      // Format sales_date to YYYY-MM-DD format
      const salesDate = new Date(rowData.sales_date)
        .toISOString()
        .split("T")[0];
      navigate("/sales-transactions/view", {
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
      const response = await get<SalesTransaction[]>(
        `/sales-transactions?sales_date=${selectedMonth}`
      );
      if (response && Array.isArray(response)) {
        const exportData = response.map((item) => {
          const docDate = String(item.doc_date);
          const monthLabel =
            (monthLabels as Record<string, string>)[docDate] ?? docDate;
          return {
            Month: monthLabel,
            "BC Code": String(item.bc_code ?? ""),
            Division: String(item.division ?? ""),
            "Store IFS": String(item.whs_code ?? ""),
            "Store Name": String(item.whs_name ?? ""),
            "Item Code": String(item.item_code ?? ""),
            "Item Name": String(item.item_desc ?? ""),
            "Gross Sales": String(item.gross_sales ?? ""),
            "Net Sales": String(item.net_sales ?? ""),
            Qty: String(item.quantity ?? ""),
            "Converted Qty": String(item.converted_quantity ?? ""),
            "Unit Price": String(item.unit_price ?? ""),
            "Vat Amt": String(item.vat_amount ?? ""),
            "Item Cost": String(item.item_cost ?? ""),
            "Disc. Amt": String(item.disc_amount ?? ""),
            Category2: String(item.cat02 ?? ""),
            "Sales Conv": String(item.sales_conv ?? ""),
            "Item Group": String(item.item_group ?? ""),
          };
        });
        exportJsonToExcel(
          exportData,
          `sales-transactions-${selectedMonth}.xlsx`
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
  }, [get, selectedMonth, monthLabels]);

  const columns: GridColDef<SalesTransaction>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<SalesTransaction>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 0.8,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<SalesTransaction>) => {
          if (!params.row) return null;
          const rowData = params.row;

          return (
            <DatagridActions<SalesTransaction>
              rowId={rowData.id}
              actions={[
                {
                  type: "view",
                  icon: Visibility,
                  onClick: () => handleView(rowData.id, rowData),
                  tooltip: "View Sales Transaction",
                  ariaLabel: "View Sales Transaction",
                },
              ]}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [handleView]);

  const selectComponent = (
    <TextField
      select
      label="Month"
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      size="small"
      sx={{ width: 180, mr: 2 }}
    >
      {monthOptions.map((month) => (
        <MenuItem key={month} value={month}>
          {monthLabels[month as keyof typeof monthLabels]}
        </MenuItem>
      ))}
    </TextField>
  );

  const actionButton = (
    <Button
      variant="contained"
      startIcon={<FileDownload />}
      onClick={handleExportToExcel}
      color="secondary"
      disabled={exporting}
    >
      {exporting ? "Exporting..." : "Export"}
    </Button>
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Sales Transactions" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="SALES TRANSACTIONS"
        subtitle="View sales transactions per location"
        selectComponent={selectComponent}
        actionButton={actionButton}
      />
      <CustomDataGrid<SalesTransaction>
        rows={dataRows}
        columns={columns}
        getRowId={(row: SalesTransaction) => row.id}
        initialMobileHiddenFields={mobileHiddenSalesFields}
        initialNonMobileHiddenFields={nonMobileHiddenSalesFields}
      />
    </Box>
  );
};

export default SalesTransactionsListing;
