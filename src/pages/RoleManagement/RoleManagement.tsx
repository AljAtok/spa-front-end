// src/pages/RolesManagement/RolesManagement.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  fetchAllRoles,
  toggleRoleStatusActivate,
  toggleRoleStatusDeactivate,
} from "../../api/roleApi";
import { Role } from "../../types/RoleTypes";
import { getErrorMessage } from "@/utils/errorUtils";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";

import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "../../hooks/useActionButtonsGuard";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

// Define dynamic column configuration outside component to prevent unnecessary re-renders
const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "role_name",
    headerName: "Role Name",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  { field: "role_level", headerName: "Role Level", type: "number", flex: 0.8 },
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
  // The 'actions' column is often static due to its specific handlers and UI.
  // appended separately as it requires access to component-level handlers.
];

const mobileHiddenFields = ["role_level", "created_user", "created_at"];
const nonMobileHiddenFields = [""];

// --- RolesManagement Component ---
const RolesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  if (error) {
    console.log(error);
  }

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("roles");

  // Initialize the api hook once at the component level
  const apiInstance = useApi();

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [roleToToggleStatus, setRoleToToggleStatus] = useState<Role | null>(
    null
  );

  // Memoize just the methods we need
  const { get, patch } = useMemo(
    () => ({
      get: apiInstance.get,
      patch: apiInstance.patch,
    }),
    [apiInstance]
  );
  const loadRolesData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const data: Role[] = await fetchAllRoles({ get });
      setDataRows(data);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to load roles");
      console.error("Error fetching roles data:", error);
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadRolesData();
  }, [loadRolesData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Role) => {
      console.log(`Edit Role with ID:`, id, `Data:`, rowData);
      navigate("/role-form", { state: { roleId: id } });
    },
    [navigate]
  );

  // TOGGLE STATUS LOGIC (Deactivate/Activate) ---
  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Role) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setRoleToToggleStatus(rowData); // Store the role to be toggled
      setOpenToggleStatusDialog(true); // Open the toggle status confirmation dialog
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setRoleToToggleStatus(null);
  }, []);
  const handleConfirmToggleStatus = useCallback(async () => {
    if (!roleToToggleStatus) return;

    setOpenToggleStatusDialog(false);

    try {
      const newStatusId = roleToToggleStatus.status_id === 1 ? 2 : 1;
      const toggleFunction =
        newStatusId === 2
          ? toggleRoleStatusDeactivate
          : toggleRoleStatusActivate;

      await toggleFunction(
        { patch },
        roleToToggleStatus.id,
        newStatusId,
        roleToToggleStatus.role_name
      );
      loadRolesData(); // Refresh list
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        `Failed to ${
          roleToToggleStatus.status_id === 1 ? "deactivate" : "activate"
        } role "${roleToToggleStatus.role_name}"`
      );
      console.error("Toggle status failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setRoleToToggleStatus(null);
    }
  }, [roleToToggleStatus, loadRolesData, patch]);

  // const handleView = useCallback(
  //   (id: string | number, rowData: Role) => {
  //     console.log(`View Role details with ID:`, id, `Data:`, rowData);
  //     navigate("/view-role", { state: { roleId: id } });
  //   },
  //   [navigate]
  // );
  const handleNew = useCallback(() => {
    console.log("Add New Role");
    navigate("/role-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "roles",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Role",
    activateTooltip: "Activate Role",
    deactivateTooltip: "Deactivate Role",
  });

  const columns: GridColDef<Role>[] = useMemo(() => {
    // Dynamically generate the core columns based on the configuration
    const generatedColumns = mapColumnConfigToGridColDef<Role>(COLUMN_CONFIG);

    // Append the static 'actions' column
    return [
      ...generatedColumns,
      {
        field: "actions", // This field doesn't exist on Role but is for the column itself
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Role>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<Role>
              rowId={id}
              actions={buttonActionGrid.actions}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [buttonActionGrid]); // Regenerate columns if buttonActionGrid (handlers) changes

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {roleToToggleStatus?.status_id === 1 ? " deactivate" : " activate"} Role
        "<strong>{roleToToggleStatus?.role_name || "this role"}</strong>"? This
        action cannot be undone.
      </>
    ),
    [roleToToggleStatus?.status_id, roleToToggleStatus?.role_name]
  );

  const dialogTitle = useMemo(
    () => (roleToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation"),
    [roleToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Roles" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="ROLES MANAGEMENT"
        subtitle="Manage user roles"
        actionButton={
          <HeaderActionButton moduleAlias="roles" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Role>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Role) => row.id}
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

export default RolesManagement;
