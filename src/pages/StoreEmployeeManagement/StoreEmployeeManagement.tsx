import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { StoreEmployee } from "@/types/StoreEmployeeType";
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
  fetchStoreEmployees,
  toggleStoreEmployeeStatusActivate,
  toggleStoreEmployeeStatusDeactivate,
} from "@/api/storeEmployeeApi";
import HeaderActionButton from "@/components/HeaderActionButton";
import { Header } from "@/components/Header";
import { DynamicColumnConfig } from "@/types/columnConfig";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  // { field: "id", headerName: "ID", width: 70 },
  { field: "location_name", headerName: "Location", width: 70 },
  { field: "warehouse_ifs", headerName: "Store IFS", width: 70 },
  { field: "warehouse_name", headerName: "Store Name", flex: 1 },
  { field: "assigned_ss_name", headerName: "SS", flex: 1 },
  { field: "assigned_ah_name", headerName: "AH", flex: 1 },
  { field: "assigned_bch_name", headerName: "BCH", flex: 1 },
  { field: "assigned_gbch_name", headerName: "GBCH", flex: 1 },
  { field: "assigned_rh_name", headerName: "RH", flex: 1 },
  { field: "assigned_grh_name", headerName: "GRH", flex: 1 },
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
const nonMobileHiddenFields = [""];

const StoreEmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<StoreEmployee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [employeeToToggleStatus, setEmployeeToToggleStatus] =
    useState<StoreEmployee | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("store-employees");

  const loadEmployeesData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = (await fetchStoreEmployees({ get })) as
        | StoreEmployee[]
        | { data: StoreEmployee[] };
      const employees = Array.isArray(response)
        ? response
        : (response as { data: StoreEmployee[] }).data;
      setDataRows(
        employees.map((employee: StoreEmployee) => ({
          ...employee,
          id: employee.id,
          warehouse_ifs: employee.warehouse_ifs || "",
          warehouse_name: employee.warehouse_name || "",
          location_name: employee.location_name || "",
          assigned_ss_name: employee.assigned_ss_name || "",
          assigned_ah_name: employee.assigned_ah_name || "",
          assigned_bch_name: employee.assigned_bch_name || "",
          assigned_gbch_name: employee.assigned_gbch_name || "",
          assigned_rh_name: employee.assigned_rh_name || "",
          assigned_grh_name: employee.assigned_grh_name || "",
          status_name:
            employee.status_name ||
            (employee.status_id === 1 ? "ACTIVE" : "INACTIVE"),
          created_user: employee.created_user || "",
          created_at: employee.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading store employees:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadEmployeesData();
  }, [loadEmployeesData]);

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: StoreEmployee) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setEmployeeToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setEmployeeToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (employeeToToggleStatus) {
      try {
        const newStatusId = employeeToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleStoreEmployeeStatusDeactivate
            : toggleStoreEmployeeStatusActivate;
        await toggleFunction(
          { patch },
          employeeToToggleStatus.id.toString(),
          newStatusId
        );
        await loadEmployeesData();
        setOpenToggleStatusDialog(false);
        setEmployeeToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling store employee status:", error);
      }
    }
  }, [employeeToToggleStatus, loadEmployeesData, patch]);

  const handleEdit = useCallback(
    (id: string | number, rowData: StoreEmployee) => {
      console.log(`Edit store employee id with ID:`, id, `Data:`, rowData);
      navigate("/store-employee-form", { state: { storeEmployeeId: id } });
    },
    [navigate]
  );

  const handleNew = useCallback(() => {
    navigate("/store-employee-form");
  }, [navigate]);

  const handleUpload = useCallback(() => {
    navigate("/store-employees/upload");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "store-employees",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Store Employee",
    activateTooltip: "Activate Store Employee",
    deactivateTooltip: "Deactivate Store Employee",
  });

  const columns: GridColDef<StoreEmployee>[] = useMemo(() => {
    // const generatedColumns = COLUMN_CONFIG.map((col) => ({ ...col }));
    const generatedColumns =
      mapColumnConfigToGridColDef<StoreEmployee>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<StoreEmployee>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<StoreEmployee>
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
        {employeeToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Store Employee "
        <strong>
          {employeeToToggleStatus?.warehouse_name || "this store employee"}
        </strong>
        "? This action cannot be undone.
      </>
    ),
    [employeeToToggleStatus]
  );

  const dialogTitle = useMemo(
    () =>
      employeeToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [employeeToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Warehouse Employees" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="STORE PERSONNEL MANAGEMENT"
        subtitle="Manage store personnel"
        actionButton={
          <>
            <HeaderActionButton
              moduleAlias="store-employees"
              onClick={handleNew}
            />
            <HeaderActionButton
              moduleAlias="store-employees"
              onClick={handleUpload}
              text="Upload"
              icon={UploadOutlinedIcon}
            />
          </>
        }
      />
      {/* <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/store-employees/upload")}
        >
          Upload Excel
        </Button>
      </Box> */}
      <CustomDataGrid<StoreEmployee>
        rows={dataRows}
        columns={columns}
        getRowId={(row: StoreEmployee) => row.id}
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

export default StoreEmployeeManagement;
