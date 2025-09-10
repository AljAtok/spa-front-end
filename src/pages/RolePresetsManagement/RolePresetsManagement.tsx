import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  toggleRolePresetStatusActivate,
  toggleRolePresetStatusDeactivate,
} from "../../api/rolePresetsApi";
import { RolePreset } from "../../types/RolePresetsTypes";
import { useApi } from "@/hooks/useApi";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";

import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "../../hooks/useActionButtonsGuard";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "role_name",
    headerName: "Role",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  {
    field: "module_name",
    headerName: "Modules",
    flex: 1.5,
    renderer: "arrayList",
  },
  {
    field: "action_name",
    headerName: "Actions",
    flex: 1.5,
    renderer: "arrayList",
  },
  {
    field: "location_name",
    headerName: "Locations",
    flex: 1.5,
    renderer: "arrayList",
  },
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

const mobileHiddenRolePresetsFields = [
  "id",
  "action_name",
  "created_user",
  "created_at",
  "location_name",
];
const nonMobileHiddenRolePresetsFields = ["id"];

const RolePresetsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<RolePreset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("role-presets");

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [rolePresetToToggleStatus, setRolePresetToToggleStatus] =
    useState<RolePreset | null>(null);

  const loadRolePresetsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<{ data: RolePreset[] }>(
        "/role-action-presets"
      );
      if (response) {
        const rolePresets = Array.isArray(response) ? response : response.data;
        setDataRows(
          rolePresets.map((rolePreset) => ({
            ...rolePreset,
            id: rolePreset.id,
            role_name: rolePreset.role_name || "",
            module_name: rolePreset.module_name || [],
            action_name: rolePreset.action_name || [],
            location_name: rolePreset.location_name || [],
            status_name:
              rolePreset.status_name ||
              (rolePreset.status_id === 1 ? "ACTIVE" : "INACTIVE"),
            created_user: rolePreset.created_user || "",
            created_at: rolePreset.created_at || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading role presets:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadRolePresetsData();
  }, [loadRolePresetsData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: RolePreset) => {
      const role_id = rowData.role_id;
      console.log(`Edit Role Preset with ID:`, id, `Data:`, rowData);
      navigate("/role-preset-form", { state: { rolePresetId: role_id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: RolePreset) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setRolePresetToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setRolePresetToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (rolePresetToToggleStatus) {
      try {
        const newStatusId = rolePresetToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleRolePresetStatusDeactivate
            : toggleRolePresetStatusActivate;

        // console.log("role ID : " + rolePresetToToggleStatus.role_id);
        await toggleFunction(
          { patch },
          rolePresetToToggleStatus.role_id,
          newStatusId,
          rolePresetToToggleStatus.role_name
        );
        await loadRolePresetsData();
        setOpenToggleStatusDialog(false);
        setRolePresetToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling role preset status:", error);
      }
    }
  }, [rolePresetToToggleStatus, loadRolePresetsData, patch]);
  const handleNew = useCallback(() => {
    console.log("Add New Role Preset");
    navigate("/role-preset-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "role-presets",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Role Preset",
    activateTooltip: "Activate Role Preset",
    deactivateTooltip: "Deactivate Role Preset",
  });

  const columns: GridColDef<RolePreset>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<RolePreset>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<RolePreset>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<RolePreset>
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
        {rolePresetToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Role Preset for "
        <strong>
          {rolePresetToToggleStatus?.role_name || "this role preset"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [rolePresetToToggleStatus?.status_id, rolePresetToToggleStatus?.role_name]
  );

  const dialogTitle = useMemo(
    () =>
      rolePresetToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [rolePresetToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Role Presets" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="ROLE PRESETS MANAGEMENT"
        subtitle="Manage role action presets"
        actionButton={
          <HeaderActionButton moduleAlias="role-presets" onClick={handleNew} />
        }
      />
      <CustomDataGrid<RolePreset>
        rows={dataRows}
        columns={columns}
        getRowId={(row: RolePreset) => row.id}
        initialMobileHiddenFields={mobileHiddenRolePresetsFields}
        initialNonMobileHiddenFields={nonMobileHiddenRolePresetsFields}
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

export default RolePresetsManagement;
