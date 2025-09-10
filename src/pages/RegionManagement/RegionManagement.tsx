// src/pages/RegionManagement/RegionManagement.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  toggleRegionStatusActivate,
  toggleRegionStatusDeactivate,
} from "@/api/regionApi";
import { Region } from "@/types/RegionTypes";
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
    field: "region_name",
    headerName: "Region",
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

const mobileHiddenRegionFields = ["created_user", "created_at"];
const nonMobileHiddenRegionFields = [""];

const RegionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Region[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [regionToToggleStatus, setRegionToToggleStatus] =
    useState<Region | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("regions");

  const loadRegionsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<{ data: Region[] }>("/regions");
      if (response) {
        const regions = Array.isArray(response) ? response : response.data;
        setDataRows(
          regions.map((region) => ({
            ...region,
            id: region.id,
            region_name: region.region_name || "",
            status_name:
              region.status_name ||
              (region.status_id === 1 ? "ACTIVE" : "INACTIVE"),
            created_user: region.created_user || "",
            created_at: region.created_at || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading regions:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadRegionsData();
  }, [loadRegionsData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Region) => {
      console.log(`Edit Region with ID:`, id, `Data:`, rowData);
      navigate("/region-form", { state: { regionId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Region) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setRegionToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setRegionToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (regionToToggleStatus) {
      try {
        const newStatusId = regionToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleRegionStatusDeactivate
            : toggleRegionStatusActivate;
        await toggleFunction(
          { patch },
          regionToToggleStatus.id.toString(),
          newStatusId,
          regionToToggleStatus.region_name
        );
        await loadRegionsData();
        setOpenToggleStatusDialog(false);
        setRegionToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling region status:", error);
      }
    }
  }, [regionToToggleStatus, loadRegionsData, patch]);

  const handleNew = useCallback(() => {
    console.log("Add New Region");
    navigate("/region-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "regions",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Region",
    activateTooltip: "Activate Region",
    deactivateTooltip: "Deactivate Region",
  });

  const columns: GridColDef<Region>[] = useMemo(() => {
    const generatedColumns = mapColumnConfigToGridColDef<Region>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Region>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<Region>
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
        {regionToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Region "
        <strong>{regionToToggleStatus?.region_name || "this region"}</strong>"?
        This action cannot be undone.
      </>
    ),
    [regionToToggleStatus?.status_id, regionToToggleStatus?.region_name]
  );

  const dialogTitle = useMemo(
    () =>
      regionToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [regionToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Regions" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="REGIONS MANAGEMENT"
        subtitle="Manage regions"
        actionButton={
          <HeaderActionButton moduleAlias="regions" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Region>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Region) => row.id}
        initialMobileHiddenFields={mobileHiddenRegionFields}
        initialNonMobileHiddenFields={nonMobileHiddenRegionFields}
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

export default RegionManagement;
