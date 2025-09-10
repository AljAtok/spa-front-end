import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import {
  fetchAllLocationTypes,
  toggleLocationTypeStatusActivate,
  toggleLocationTypeStatusDeactivate,
} from "../../api/locationTypeApi";
import { LocationType } from "../../types/LocationTypes";
import { useApi } from "@/hooks/useApi";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";
import ConfirmationDialog from "@/components/ConfirmDialog";
import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import { getErrorMessage } from "@/utils/errorUtils";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import { useActionButtonsGuard } from "@/hooks/useActionButtonsGuard";

// Define column configuration outside component to prevent unnecessary re-renders
const LOCATION_TYPE_COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "location_type_name",
    headerName: "Location Type",
    flex: 1,
    cellClassName: "name-column--cell",
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

const mobileHiddenFields = ["created_user", "created_at"];
const nonMobileHiddenFields: string[] = [];

const LocationTypeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<LocationType[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [locationTypeToToggle, setLocationTypeToToggle] =
    useState<LocationType | null>(null);

  // Initialize the api hook once at the component level
  const apiInstance = useApi();

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("location-types");

  // Memoize just the methods we need
  const { get, patch } = useMemo(
    () => ({
      get: apiInstance.get,
      patch: apiInstance.patch,
    }),
    [apiInstance]
  );
  const loadLocationTypes = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const data: LocationType[] = await fetchAllLocationTypes({ get });
      setDataRows(data);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load location types"
      );
      console.error("Error fetching location types data:", error);
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadLocationTypes();
  }, [loadLocationTypes]);
  const handleEdit = useCallback(
    (id: string | number, rowData: LocationType) => {
      console.log(`Edit Location Type with ID:`, id, `Data:`, rowData);
      navigate("/location-type-form", { state: { locationTypeId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: LocationType) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setLocationTypeToToggle(rowData);
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setConfirmDialogOpen(false);
    setLocationTypeToToggle(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (locationTypeToToggle) {
      try {
        const newStatusId = locationTypeToToggle.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleLocationTypeStatusDeactivate
            : toggleLocationTypeStatusActivate;

        await toggleFunction(
          { patch },
          locationTypeToToggle.id.toString(),
          newStatusId,
          locationTypeToToggle.location_type_name
        );
        await loadLocationTypes();
        setConfirmDialogOpen(false);
        setLocationTypeToToggle(null);
      } catch (error) {
        console.error("Error toggling location type status:", error);
      }
    }
  }, [locationTypeToToggle, loadLocationTypes, patch]);

  const handleNew = useCallback(() => {
    console.log("Add New Location Type");
    navigate("/location-type-form");
  }, [navigate]);

  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "location-types",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Location Type",
    activateTooltip: "Activate Location Type",
    deactivateTooltip: "Deactivate Location Type",
  });

  const columns: GridColDef<LocationType>[] = useMemo(() => {
    // Dynamically generate the core columns based on the configuration
    const generatedColumns = mapColumnConfigToGridColDef<LocationType>(
      LOCATION_TYPE_COLUMN_CONFIG
    );

    // Append the static 'actions' column
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<LocationType>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<LocationType>
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
        {locationTypeToToggle?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Location Type "
        <strong>
          {locationTypeToToggle?.location_type_name || "this location type"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [locationTypeToToggle?.status_id, locationTypeToToggle?.location_type_name]
  );

  const dialogTitle = useMemo(
    () =>
      locationTypeToToggle?.status_id === 1 ? "Deactivation" : "Activation",
    [locationTypeToToggle?.status_id]
  );

  if (error) {
    console.log(error);
  }

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Location Types" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="LOCATION TYPES"
        subtitle="Managing Location Types"
        actionButton={
          <HeaderActionButton
            moduleAlias="location-types"
            onClick={handleNew}
          />
        }
      />
      <CustomDataGrid<LocationType>
        rows={dataRows}
        columns={columns}
        getRowId={(row: LocationType) => row.id}
        initialMobileHiddenFields={mobileHiddenFields}
        initialNonMobileHiddenFields={nonMobileHiddenFields}
      />
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={handleCloseToggleStatusDialog}
        onConfirm={handleConfirmToggleStatus}
        title={dialogTitle}
        message={dialogMessage}
      />
    </Box>
  );
};

export default LocationTypeManagement;
