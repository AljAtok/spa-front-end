// src/pages/TakeOutStoreManagement/TakeOutStoreManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import CustomDataGrid from "@/components/CustomDataGrid";
import PageLoader from "@/components/PageLoader";
import DatagridActions from "@/components/DatagridActions";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import ConfirmationDialog from "@/components/ConfirmDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useActionButtonsGuard } from "@/hooks/useActionButtonsGuard";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useApi } from "@/hooks/useApi";
// import { getErrorMessage } from "@/utils/errorUtils";
import { TakeOutStore } from "@/types/TakeOutStoreTypes";
import {
  fetchTakeOutStores,
  toggleTakeOutStoreStatusActivate,
  toggleTakeOutStoreStatusDeactivate,
} from "@/api/takeOutStoreApi";
// import PermissionGuard from "@/components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { DynamicColumnConfig } from "@/types/columnConfig";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
// import HeaderActionButton from "@/components/HeaderActionButton";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  // { field: "id", headerName: "ID", width: 70 },
  { field: "location_name", headerName: "Location", flex: 1 },
  { field: "warehouse_name", headerName: "Store Name", flex: 1.5 },
  { field: "warehouse_code", headerName: "Code", flex: 1 },
  { field: "warehouse_ifs", headerName: "IFS", flex: 1 },
  { field: "warehouse_type_name", headerName: "Type", flex: 1 },
  { field: "segment_name", headerName: "Segment", flex: 1.5 },
  { field: "address", headerName: "Address", flex: 2 },
  {
    field: "rem_status_name",
    headerName: "Store Status",
    flex: 0.8,
    // renderer: "statusName",
  },
  {
    field: "status_name",
    headerName: "System Stat",
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

const mobileHiddenFields = [
  "created_user",
  "created_at",
  "actions",
  "address",
  "warehouse_type_name",
  "segment_name",
  "status_name",
];
const nonMobileHiddenFields = [
  "created_user",
  "address",
  "actions",
  "status_name",
];

const TakeOutStoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<TakeOutStore[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [storeToToggleStatus, setStoreToToggleStatus] =
    useState<TakeOutStore | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("takeout_stores");

  const loadStoresData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetchTakeOutStores({ get });
      const stores = Array.isArray(response) ? response : response.data;
      setDataRows(
        stores.map((store) => ({
          ...store,
          id: store.id,
          warehouse_name: store.warehouse_name || "",
          warehouse_code: store.warehouse_code || "",
          warehouse_ifs: store.warehouse_ifs || "",
          warehouse_type_name: store.warehouse_type_name || "",
          location_name: store.location_name || "",
          segment_name: store.segment_name || "",
          address: store.address || "",
          rem_status_name:
            store.rem_status_name ||
            (store.rem_status_id === 8 ? "OPEN" : "N/A"),
          status_name:
            store.status_name ||
            (store.status_id === 1 ? "ACTIVE" : "INACTIVE"),
          created_user: store.created_user || "",
          created_at: store.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading stores:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadStoresData();
  }, [loadStoresData]);

  // const handleNew = useCallback(() => {
  //   console.log("Add New Location");
  //   navigate("/location-form");
  // }, [navigate]);

  const handleEdit = useCallback(
    (id: string | number, rowData: TakeOutStore) => {
      console.log(`Edit Store with ID:`, id, `Data:`, rowData);
      navigate("/take-out-store-form", { state: { warehouseId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: TakeOutStore) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setStoreToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setStoreToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (storeToToggleStatus) {
      try {
        const newStatusId = storeToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleTakeOutStoreStatusDeactivate
            : toggleTakeOutStoreStatusActivate;
        await toggleFunction({ patch }, storeToToggleStatus.id.toString());
        await loadStoresData();
        setOpenToggleStatusDialog(false);
        setStoreToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling store status:", error);
      }
    }
  }, [storeToToggleStatus, loadStoresData, patch]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "takeout_stores",
    editHandler: handleEdit, // No edit for now
    editTooltip: "Edit Store",
    toggleStatusHandler: handleToggleStatus,
    activateTooltip: "Activate Store",
    deactivateTooltip: "Deactivate Store",
  });

  const columns: GridColDef<TakeOutStore>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<TakeOutStore>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<TakeOutStore>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<TakeOutStore>
              rowId={id}
              actions={buttonActionGrid.actions}
              rowData={rowData}
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
        {storeToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Store "
        <strong>{storeToToggleStatus?.warehouse_name || "this store"}</strong>"?
        This action cannot be undone.
      </>
    ),
    [storeToToggleStatus?.status_id, storeToToggleStatus?.warehouse_name]
  );

  const dialogTitle = useMemo(
    () =>
      storeToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [storeToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="TakeOut Stores" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="STORE MANAGEMENT"
        subtitle="Manage Stores"
        // actionButton={
        //   <HeaderActionButton moduleAlias="locations" onClick={handleNew} />
        // }
      />
      <CustomDataGrid<TakeOutStore>
        rows={dataRows}
        columns={columns}
        getRowId={(row: TakeOutStore) => row.id}
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

export default TakeOutStoreManagement;
