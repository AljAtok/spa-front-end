// src/pages/SystemsManagement/SystemsManagement.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import { fetchAllSystems } from "../../api/systemApi";
import { System } from "../../types/SystemTypes";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";
import { DataGridAction } from "../../components/DatagridActions";

// Define column configuration outside component to prevent unnecessary re-renders
const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "system_code",
    headerName: "System Code",
    flex: 1,
    cellClassName: "name-column--cell",
  },
  { field: "system_name", headerName: "System Name", flex: 1.5 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
  },
];

// Mobile and tablet hidden fields configuration
const mobileHiddenFields = ["id"];
const nonMobileHiddenFields: string[] = [];

const SystemsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<System[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const loadSystemsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data: System[] = await fetchAllSystems();
      setDataRows(data);
    } catch (error: unknown) {
      console.error("Error fetching systems data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadSystemsData();
  }, [loadSystemsData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: System) => {
      console.log(`Edit System with ID:`, id, `Data:`, rowData);
      navigate("/system-form", { state: { systemId: id } });
    },
    [navigate]
  );

  const handleView = useCallback(
    (id: string | number, rowData: System) => {
      console.log(`View System details with ID:`, id, `Data:`, rowData);
      navigate("/view-system", { state: { systemId: id } });
    },
    [navigate]
  );

  const handleNew = useCallback(() => {
    console.log("Add New System");
    navigate("/system-form");
  }, [navigate]);

  // Define button actions manually since System doesn't have status_id for ActionButtonsGuard
  const buttonActionGrid: DataGridAction<System>[] = useMemo(
    () => [
      {
        type: "edit",
        onClick: handleEdit,
        tooltip: "Edit System",
        color: "success",
        icon: EditOutlinedIcon,
        ariaLabel: "edit",
      },
      {
        type: "view",
        onClick: handleView,
        tooltip: "View System Details",
        color: "info",
        icon: VisibilityOutlinedIcon,
        ariaLabel: "view",
      },
    ],
    [handleEdit, handleView]
  );

  const columns: GridColDef<System>[] = useMemo(() => {
    // Dynamically generate the core columns based on the configuration
    const generatedColumns = mapColumnConfigToGridColDef<System>(COLUMN_CONFIG);

    // Append the static 'actions' column
    return [
      ...generatedColumns,
      {
        field: "actions", // This field doesn't exist on System but is for the column itself
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<System>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<System>
              rowId={id}
              actions={buttonActionGrid}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [buttonActionGrid]); // Regenerate columns if buttonActionGrid (handlers) changes

  if (loadingData) {
    return <PageLoader modulename="Systems" />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="SYSTEMS MANAGEMENT"
        subtitle="Manage application systems"
        actionButton={
          <HeaderActionButton moduleAlias="systems" onClick={handleNew} />
        }
      />
      <CustomDataGrid<System>
        rows={dataRows}
        columns={columns}
        getRowId={(row: System) => row.id}
        initialMobileHiddenFields={mobileHiddenFields}
        initialNonMobileHiddenFields={nonMobileHiddenFields}
      />
    </Box>
  );
};

export default SystemsManagement;
