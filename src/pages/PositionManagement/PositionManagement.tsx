import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Position } from "@/types/PositionTypes";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomDataGrid from "@/components/CustomDataGrid";
import PageLoader from "@/components/PageLoader";
import DatagridActions from "@/components/DatagridActions";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "@/hooks/useActionButtonsGuard";
import {
  fetchPositions,
  togglePositionStatusActivate,
  togglePositionStatusDeactivate,
} from "@/api/positionApi";
import HeaderActionButton from "@/components/HeaderActionButton";
import { Header } from "@/components/Header";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import { DynamicColumnConfig } from "@/types/columnConfig";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "position_name", headerName: "Position Name", flex: 1 },
  { field: "position_abbr", headerName: "Abbr", flex: 1 },
  {
    field: "status_name",
    headerName: "Status",
    flex: 1,
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

const PositionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Position[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [positionToToggleStatus, setPositionToToggleStatus] =
    useState<Position | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("positions");

  const loadPositionsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetchPositions({ get });
      const positions = Array.isArray(response) ? response : response.data;
      setDataRows(
        positions.map((position) => ({
          ...position,
          id: position.id,
          position_name: position.position_name || "",
          position_abbr: position.position_abbr || "",
          status_name:
            position.status_name ||
            (position.status_id === 1 ? "ACTIVE" : "INACTIVE"),
          created_user: position.created_user || "",
          created_at: position.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading positions:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadPositionsData();
  }, [loadPositionsData]);

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Position) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setPositionToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setPositionToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (positionToToggleStatus) {
      try {
        const newStatusId = positionToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? togglePositionStatusDeactivate
            : togglePositionStatusActivate;
        await toggleFunction({ patch }, positionToToggleStatus.id.toString());
        await loadPositionsData();
        setOpenToggleStatusDialog(false);
        setPositionToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling position status:", error);
      }
    }
  }, [positionToToggleStatus, loadPositionsData, patch]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Position) => {
      console.log(`Edit Location with ID:`, id, `Data:`, rowData);
      navigate("/position-form", { state: { positionId: id } });
    },
    [navigate]
  );

  const handleNew = useCallback(() => {
    console.log("Add New Position");
    navigate("/position-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "positions",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Position",
    activateTooltip: "Activate Position",
    deactivateTooltip: "Deactivate Position",
  });

  const columns: GridColDef<Position>[] = useMemo(() => {
    // const generatedColumns = COLUMN_CONFIG.map((col) => ({ ...col }));
    const generatedColumns =
      mapColumnConfigToGridColDef<Position>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Position>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<Position>
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
        {positionToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Position "
        <strong>
          {positionToToggleStatus?.position_name || "this position"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [positionToToggleStatus?.status_id, positionToToggleStatus?.position_name]
  );

  const dialogTitle = useMemo(
    () =>
      positionToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [positionToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Positions" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="POSITION MANAGEMENT"
        subtitle="Manage positions"
        actionButton={
          <HeaderActionButton moduleAlias="locations" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Position>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Position) => row.id}
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

export default PositionManagement;
