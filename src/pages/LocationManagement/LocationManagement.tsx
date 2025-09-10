import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  toggleLocationStatusActivate,
  toggleLocationStatusDeactivate,
} from "../../api/locationApi";
import { Location } from "../../types/LocationTypes";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";

import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "../../hooks/useActionButtonsGuard";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "location_name",
    headerName: "Location",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  {
    field: "location_code",
    headerName: "Code",
    flex: 1,
  },
  {
    field: "location_abbr",
    headerName: "Abbr",
    flex: 1,
  },
  {
    field: "location_type_name",
    headerName: "Location Type",
    flex: 1,
  },
  {
    field: "region_name",
    headerName: "Region",
    flex: 1,
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

const mobileHiddenLocationFields = ["created_user", "created_at"];
const nonMobileHiddenLocationFields = [""];

const LocationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Location[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [locationToToggleStatus, setLocationToToggleStatus] =
    useState<Location | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("locations");

  const loadLocationsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<{ data: Location[] }>("/locations");
      if (response) {
        const locations = Array.isArray(response) ? response : response.data;
        setDataRows(
          locations.map((location) => ({
            ...location,
            id: location.id,
            location_name: location.location_name || "",
            location_code: location.location_code || "",
            location_abbr: location.location_abbr || "",
            location_type_name: location.location_type_name || "",
            region_name: location.region_name || "",
            status_name:
              location.status_name ||
              (location.status_id === 1 ? "ACTIVE" : "INACTIVE"),
            created_user: location.created_user || "",
            created_at: location.created_at || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadLocationsData();
  }, [loadLocationsData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Location) => {
      console.log(`Edit Location with ID:`, id, `Data:`, rowData);
      navigate("/location-form", { state: { locationId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Location) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setLocationToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setLocationToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (locationToToggleStatus) {
      try {
        const newStatusId = locationToToggleStatus.status_id === 1 ? 2 : 1;

        const toggleFunction =
          newStatusId === 2
            ? toggleLocationStatusDeactivate
            : toggleLocationStatusActivate;

        await toggleFunction(
          { patch },
          locationToToggleStatus.id.toString(),
          newStatusId,
          locationToToggleStatus.location_name
        );
        await loadLocationsData();
        setOpenToggleStatusDialog(false);
        setLocationToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling location status:", error);
      }
    }
  }, [locationToToggleStatus, loadLocationsData, patch]);

  const handleNew = useCallback(() => {
    console.log("Add New Location");
    navigate("/location-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "locations",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Location",
    activateTooltip: "Activate Location",
    deactivateTooltip: "Deactivate Location",
  });

  const columns: GridColDef<Location>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<Location>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Location>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<Location>
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
        {locationToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Location "
        <strong>
          {locationToToggleStatus?.location_name || "this location"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [locationToToggleStatus?.status_id, locationToToggleStatus?.location_name]
  );

  const dialogTitle = useMemo(
    () =>
      locationToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [locationToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Locations" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="LOCATIONS MANAGEMENT"
        subtitle="Manage locations"
        actionButton={
          <HeaderActionButton moduleAlias="locations" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Location>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Location) => row.id}
        initialMobileHiddenFields={mobileHiddenLocationFields}
        initialNonMobileHiddenFields={nonMobileHiddenLocationFields}
        loading={loadingData}
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

export default LocationManagement;
