import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  fetchAllAccessKeys,
  toggleAccessKeyStatusDeactivate,
  toggleAccessKeyStatusActivate,
} from "../../api/accessKeyApi";
import { AccessKey } from "../../types/AccessKeyTypes";
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
    field: "access_key_name",
    headerName: "Access Key Name",
    flex: 1.5,
    cellClassName: "name-column--cell",
  },
  {
    field: "access_key_abbr",
    headerName: "Abbreviation",
    flex: 1,
  },
  {
    field: "company_name",
    headerName: "Company",
    flex: 1.5,
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

const mobileHiddenAccessKeyFields = ["created_user", "created_at"];
const nonMobileHiddenAccessKeyFields = [""];

const AccessKeyManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<AccessKey[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("access-keys");

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [accessKeyToToggleStatus, setAccessKeyToToggleStatus] =
    useState<AccessKey | null>(null);

  const loadAccessKeysData = useCallback(async () => {
    setLoadingData(true);
    try {
      const accessKeys = await fetchAllAccessKeys({ get });
      setDataRows(
        accessKeys.map((accessKey) => ({
          ...accessKey,
          id: accessKey.id,
          access_key_name: accessKey.access_key_name || "",
          access_key_abbr: accessKey.access_key_abbr || "",
          company_name: accessKey.company_name || "",
          status_name:
            accessKey.status_name ||
            (accessKey.status_id === 1 ? "ACTIVE" : "INACTIVE"),
          created_user: accessKey.created_user || "",
          created_at: accessKey.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading access keys:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadAccessKeysData();
  }, [loadAccessKeysData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: AccessKey) => {
      console.log(`Edit Access Key with ID:`, id, `Data:`, rowData);
      navigate("/access-key-form", { state: { accessKeyId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: AccessKey) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setAccessKeyToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setAccessKeyToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (accessKeyToToggleStatus) {
      try {
        const newStatusId = accessKeyToToggleStatus.status_id === 1 ? 2 : 1;

        const toggleFunction =
          newStatusId === 2
            ? toggleAccessKeyStatusDeactivate
            : toggleAccessKeyStatusActivate;

        await toggleFunction(
          { patch },
          accessKeyToToggleStatus.id.toString(),
          newStatusId,
          accessKeyToToggleStatus.access_key_name
        );
        await loadAccessKeysData();
        setOpenToggleStatusDialog(false);
        setAccessKeyToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling access key status:", error);
      }
    }
  }, [accessKeyToToggleStatus, loadAccessKeysData, patch]);
  const handleNew = useCallback(() => {
    console.log("Add New Access Key");
    navigate("/access-key-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "access-keys",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Access Key",
    activateTooltip: "Activate Access Key",
    deactivateTooltip: "Deactivate Access Key",
  });

  const columns: GridColDef<AccessKey>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<AccessKey>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<AccessKey>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<AccessKey>
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
        {accessKeyToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Access Key "
        <strong>
          {accessKeyToToggleStatus?.access_key_name || "this access key"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [
      accessKeyToToggleStatus?.status_id,
      accessKeyToToggleStatus?.access_key_name,
    ]
  );

  const dialogTitle = useMemo(
    () =>
      accessKeyToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [accessKeyToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Access Keys" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="ACCESS KEYS MANAGEMENT"
        subtitle="Manage access keys"
        actionButton={
          <HeaderActionButton moduleAlias="access-keys" onClick={handleNew} />
        }
      />
      <CustomDataGrid<AccessKey>
        rows={dataRows}
        columns={columns}
        getRowId={(row: AccessKey) => row.id}
        initialMobileHiddenFields={mobileHiddenAccessKeyFields}
        initialNonMobileHiddenFields={nonMobileHiddenAccessKeyFields}
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

export default AccessKeyManagement;
