// src/pages/ModuleManagement/ModuleManagement.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  fetchAllModules,
  toggleModuleStatusActivate,
  toggleModuleStatusDeactivate,
} from "../../api/moduleApi";
import { Module } from "../../types/ModuleTypes";
import { getErrorMessage } from "@/utils/errorUtils";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import ConfirmationDialog from "@/components/ConfirmDialog";
import { useApi } from "@/hooks/useApi";
import { useActionButtonsGuard } from "@/hooks/useActionButtonsGuard";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

// Define column configuration outside component to prevent unnecessary re-renders
const MODULE_COLUMN_CONFIG: DynamicColumnConfig[] = [
  // { field: "id", headerName: "ID", width: 70 },
  {
    field: "module_name",
    headerName: "Module Name",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  { field: "module_alias", headerName: "Module Alias", flex: 1 },
  { field: "module_link", headerName: "Module Link", flex: 1 },
  { field: "parent_title", headerName: "Parent Title", flex: 1 },
  { field: "menu_title", headerName: "Menu Title", flex: 1 },
  { field: "link_name", headerName: "Link Name", flex: 1 },
  { field: "order_level", headerName: "Order", flex: 0.5 },
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

const mobileHiddenModuleFields = [
  "module_alias",
  "module_link",
  "parent_title",
  "created_user",
  "created_at",
];
const nonMobileHiddenModuleFields = ["id"];

// --- ModuleManagement Component ---
const ModuleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Module[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  if (error) {
    console.log(error);
  }

  // Initialize the api hook once at the component level
  const apiInstance = useApi();

  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("modules");

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [moduleToToggleStatus, setModuleToToggleStatus] =
    useState<Module | null>(null);

  // Memoize just the methods we need
  const { get, patch } = useMemo(
    () => ({
      get: apiInstance.get,
      // del: apiInstance.del,
      patch: apiInstance.patch,
    }),
    [apiInstance]
  );

  const loadModulesData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const data: Module[] = await fetchAllModules({ get });
      setDataRows(data);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to load modules");
      console.error("Error fetching modules data:", error);
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadModulesData();
  }, [loadModulesData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Module) => {
      console.log(`Edit Module with ID:`, id, `Data:`, rowData);
      navigate("/module-form", { state: { moduleId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Module) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setModuleToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setModuleToToggleStatus(null);
  }, []);

  // Handle toggle status confirmation
  const handleConfirmToggleStatus = useCallback(async () => {
    if (moduleToToggleStatus) {
      try {
        const newStatusId = moduleToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleModuleStatusDeactivate
            : toggleModuleStatusActivate;

        await toggleFunction(
          { patch },
          moduleToToggleStatus.id.toString(),
          newStatusId,
          moduleToToggleStatus.module_name
        );
        await loadModulesData();
        setOpenToggleStatusDialog(false);
        setModuleToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling module status:", error);
      }
    }
  }, [moduleToToggleStatus, loadModulesData, patch]);

  const handleNew = useCallback(() => {
    console.log("Add New Module");
    navigate("/module-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "modules",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Module",
    activateTooltip: "Activate Module",
    deactivateTooltip: "Deactivate Module",
  });

  const columns: GridColDef<Module>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<Module>(MODULE_COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Module>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<Module>
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
        {moduleToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Module "
        <strong>{moduleToToggleStatus?.module_name || "this module"}</strong>"?
        This action cannot be undone.
      </>
    ),
    [moduleToToggleStatus?.status_id, moduleToToggleStatus?.module_name]
  );

  const dialogTitle = useMemo(
    () =>
      moduleToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [moduleToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Modules" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="MODULES MANAGEMENT"
        subtitle="Manage system modules"
        actionButton={
          <HeaderActionButton moduleAlias="modules" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Module>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Module) => row.id}
        initialMobileHiddenFields={mobileHiddenModuleFields}
        initialNonMobileHiddenFields={nonMobileHiddenModuleFields}
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

export default ModuleManagement;
