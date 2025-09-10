import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { Header } from "../../components/Header";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import PageLoader from "../../components/PageLoader";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import HeaderActionButton from "../../components/HeaderActionButton";
import CustomDataGrid from "../../components/CustomDataGrid";
import { StoreDetail } from "../../types/SalesTransactionTypes";

import { GridColDef } from "@mui/x-data-grid";
import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  {
    field: "store_ifs",
    headerName: "Store IFS",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  {
    field: "store_name",
    headerName: "Store Name",
    flex: 1.5,
  },
  {
    field: "num_items",
    headerName: "Number of Items",
    flex: 1,
    type: "number",
  },
  {
    field: "item_categories",
    headerName: "Item Categories",
    flex: 1,
    renderer: "arrayList",
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
    field: "total_base_sales_qty",
    headerName: "Total Base Sales Qty",
    flex: 1,
    type: "number",
  },
  {
    field: "total_sales_qty",
    headerName: "Total Converted Sales Qty",
    flex: 1,
    type: "number",
  },
];

const mobileHiddenStoreFields = ["store_ifs", "num_items", "item_categories"];
const nonMobileHiddenStoreFields = [""];

interface LocationState {
  location_id: number;
  sales_date: string;
  location_name: string;
  month: string;
}

const SalesTransactionView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<StoreDetail[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { get } = useApi();
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("sales-transactions");

  // Get location data from state
  const locationState = location.state as LocationState | null;

  useEffect(() => {
    const loadStoreDetails = async () => {
      if (
        !locationState ||
        !locationState.location_id ||
        !locationState.sales_date
      ) {
        setError(
          "Missing location data. Please navigate from the sales transactions listing."
        );
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const response = await get<StoreDetail[]>(
          `/sales-transactions/per-location/${locationState.location_id}/${locationState.sales_date}`
        );
        if (response) {
          const stores = Array.isArray(response) ? response : [response];
          setDataRows(
            stores.map((store: StoreDetail) => ({
              ...store,
              id: store.store_ifs, // Use store_ifs as id for DataGrid
              store_ifs: store.store_ifs || "",
              store_name: store.store_name || "",
              num_items: store.num_items || 0,
              item_categories: store.item_categories || [],
              gross_sales: store.gross_sales || 0,
              net_sales: store.net_sales || 0,
              total_sales_qty: store.total_sales_qty || 0,
              total_base_sales_qty: store.total_base_sales_qty || 0,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading store details:", err);
        setError("Failed to load store details");
      } finally {
        setLoadingData(false);
      }
    };

    if (hasViewPermission) {
      loadStoreDetails();
    }
  }, [locationState, get, hasViewPermission]);

  const handleBack = useCallback(() => {
    navigate("/sales-transactions");
  }, [navigate]);

  const columns: GridColDef<StoreDetail>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<StoreDetail>(COLUMN_CONFIG);
    return generatedColumns;
  }, []);

  if (permissionsLoading) {
    return <PageLoader modulename="Sales Transaction Details" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  if (error) {
    return (
      <Box m="0px 10px auto 10px">
        <Header
          title="SALES TRANSACTION DETAILS"
          subtitle="View store sales details"
          actionButton={
            <HeaderActionButton
              moduleAlias="sales-transactions"
              onClick={handleBack}
              icon={ArrowBack}
              text="Back"
            />
          }
        />
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="SALES TRANSACTION DETAILS"
        subtitle={
          locationState
            ? `Store details for ${locationState.location_name} - ${locationState.month}`
            : "View store sales details"
        }
        actionButton={
          <Button
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/sales-transactions")}
            sx={{ ml: 2 }}
          >
            Back to List
          </Button>
        }
      />

      <CustomDataGrid<StoreDetail>
        rows={dataRows}
        columns={columns}
        getRowId={(row: StoreDetail) => row.id}
        initialMobileHiddenFields={mobileHiddenStoreFields}
        initialNonMobileHiddenFields={nonMobileHiddenStoreFields}
        loading={loadingData}
      />
    </Box>
  );
};

export default SalesTransactionView;
