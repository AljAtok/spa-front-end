import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "../../hooks/useActionButtonsGuard";
import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import UploadIcon from "@mui/icons-material/Upload";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "location_name", headerName: "Location", flex: 0.5 },
  { field: "warehouse_ifs", headerName: "Store IFS", flex: 0.5 },
  { field: "warehouse_name", headerName: "Store Name", flex: 1.5 },
  { field: "warehouse_rate", headerName: "Rate", flex: 1 },
  {
    field: "status_name",
    headerName: "Status",
    flex: 0.8,
    renderer: "statusName",
  },
  {
    field: "created_user",
    headerName: "Created By",
    flex: 1,
    renderer: "createdUser",
  },
  {
    field: "created_at",
    headerName: "Created At",
    flex: 1,
    renderer: "dateTime",
    dateFieldKey: "created_at",
  },
];

const mobileHiddenFields = ["created_user", "created_at"];
const nonMobileHiddenFields = [""];

interface StoreRate extends Record<string, unknown> {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  warehouse_rate: string;
  status_id: number;
  status_name: string;
  created_at: string;
  created_by: number;
  updated_by: number;
  modified_at: string;
  created_user: string;
  updated_user: string;
}

const StoreRateManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<StoreRate[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [rowToToggleStatus, setRowToToggleStatus] = useState<StoreRate | null>(
    null
  );
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("store-rates");

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<StoreRate[] | { data: StoreRate[] }>(
        "/warehouse-rates"
      );
      const rates = Array.isArray(response) ? response : response.data;
      setDataRows(rates);
    } catch (error) {
      console.error("Error loading store rates:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback(
    (id: string | number) => {
      navigate("/store-rate-form", { state: { rateId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (_id: string | number, rowData: StoreRate) => {
      setRowToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setRowToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (rowToToggleStatus) {
      try {
        const newStatusId = rowToToggleStatus.status_id === 1 ? 2 : 1;
        const endpoint =
          newStatusId === 2
            ? `/warehouse-rates/${rowToToggleStatus.id}/toggle-status-deactivate`
            : `/warehouse-rates/${rowToToggleStatus.id}/toggle-status-activate`;
        await patch(endpoint, { status_id: newStatusId });
        await loadData();
        setOpenToggleStatusDialog(false);
        setRowToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling store rate status:", error);
      }
    }
  }, [rowToToggleStatus, loadData, patch]);

  const handleNew = useCallback(() => {
    navigate("/store-rate-form");
  }, [navigate]);

  const handleUpload = useCallback(() => {
    navigate("/store-rate-upload");
  }, [navigate]);

  const buttonActionGrid = useActionButtonsGuard<StoreRate>({
    moduleAlias: "store-rates",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Store Rate",
    activateTooltip: "Activate Store Rate",
    deactivateTooltip: "Deactivate Store Rate",
  });

  const columns: GridColDef<StoreRate>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<StoreRate>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<StoreRate>) => {
          if (!params.row) return null;
          return (
            <DatagridActions<StoreRate>
              rowId={params.row.id}
              actions={buttonActionGrid.actions}
              rowData={params.row}
            />
          );
        },
      },
    ];
  }, [buttonActionGrid]);

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {rowToToggleStatus?.status_id === 1 ? " deactivate" : " activate"}{" "}
        Location "
        <strong>{rowToToggleStatus?.warehouse_name || "this location"}</strong>
        "? This action cannot be undone.
      </>
    ),
    [rowToToggleStatus?.status_id, rowToToggleStatus?.warehouse_name]
  );

  const dialogTitle = useMemo(
    () => (rowToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation"),
    [rowToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Store Rates" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="STORE RATE MANAGEMENT"
        subtitle="Manage store rates"
        actionButton={
          <Box display="flex" gap={1}>
            <HeaderActionButton moduleAlias="store-rates" onClick={handleNew} />
            <HeaderActionButton
              moduleAlias="store-rates"
              onClick={handleUpload}
              text="Upload"
              icon={UploadIcon}
            />
          </Box>
        }
      />
      <CustomDataGrid<StoreRate>
        rows={dataRows}
        columns={columns}
        getRowId={(row: StoreRate) => row.id}
        initialMobileHiddenFields={mobileHiddenFields}
        initialNonMobileHiddenFields={nonMobileHiddenFields}
      />
      <ConfirmationDialog
        open={openToggleStatusDialog}
        onClose={handleCloseToggleStatusDialog}
        onConfirm={handleConfirmToggleStatus}
        message={dialogMessage}
        title={dialogTitle}
      />
    </Box>
  );
};

export default StoreRateManagement;
