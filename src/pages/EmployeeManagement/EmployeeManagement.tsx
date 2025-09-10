import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Employee } from "@/types/EmployeeTypes";
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
  fetchEmployees,
  toggleEmployeeStatusActivate,
  toggleEmployeeStatusDeactivate,
} from "@/api/employeeApi";
import HeaderActionButton from "@/components/HeaderActionButton";
import { Header } from "@/components/Header";
import { DynamicColumnConfig } from "@/types/columnConfig";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  // { field: "id", headerName: "ID", width: 70 },
  { field: "employee_number", headerName: "Employee #", width: 70 },
  { field: "employee_full_name", headerName: "First Name", flex: 1 },
  // { field: "employee_last_name", headerName: "Last Name", flex: 1 },
  { field: "employee_email", headerName: "Email", flex: 1 },
  {
    field: "locations",
    headerName: "Locations",
    flex: 1,
    renderer: "objectArray",
    objectArrayConfig: {
      arrayField: "locations",
      getDisplayValue: (location: Record<string, unknown>) =>
        (location as { location_name: string }).location_name,
    },
  },
  { field: "position_name", headerName: "Position", flex: 1 },
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

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [employeeToToggleStatus, setEmployeeToToggleStatus] =
    useState<Employee | null>(null);

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("employees");

  const loadEmployeesData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetchEmployees({ get });
      const employees = Array.isArray(response) ? response : response.data;
      setDataRows(employees); // Use the data directly without mapping since the structure now matches
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadEmployeesData();
  }, [loadEmployeesData]);

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Employee) => {
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
            ? toggleEmployeeStatusDeactivate
            : toggleEmployeeStatusActivate;
        await toggleFunction(
          { patch },
          employeeToToggleStatus.id.toString(),
          newStatusId,
          `${employeeToToggleStatus.employee_first_name} ${employeeToToggleStatus.employee_last_name}`
        );
        await loadEmployeesData();
        setOpenToggleStatusDialog(false);
        setEmployeeToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling employee status:", error);
      }
    }
  }, [employeeToToggleStatus, loadEmployeesData, patch]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Employee) => {
      console.log(`Edit employee with ID:`, id, `Data:`, rowData);
      navigate("/employee-form", { state: { employeeId: id } });
    },
    [navigate]
  );

  const handleNew = useCallback(() => {
    navigate("/employee-form");
  }, [navigate]);

  const handleUpload = useCallback(() => {
    navigate("/employees/upload");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGuard = useActionButtonsGuard({
    moduleAlias: "employees",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Employee",
    activateTooltip: "Activate Employee",
    deactivateTooltip: "Deactivate Employee",
  });

  const columns: GridColDef<Employee>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<Employee>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<Employee>
              rowId={id}
              actions={buttonActionGuard.actions}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [buttonActionGuard]);

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {employeeToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Employee "
        <strong>
          {employeeToToggleStatus
            ? `${employeeToToggleStatus.employee_first_name} ${employeeToToggleStatus.employee_last_name}`
            : "this employee"}
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
    return <PageLoader modulename="Employees" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="EMPLOYEE MANAGEMENT"
        subtitle="Manage employees"
        actionButton={
          <>
            <HeaderActionButton moduleAlias="employees" onClick={handleNew} />
            <HeaderActionButton
              moduleAlias="employees"
              onClick={handleUpload}
              text="Upload"
              icon={UploadOutlinedIcon}
            />
          </>
        }
      />
      <CustomDataGrid<Employee>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Employee) => row.id}
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

export default EmployeeManagement;
