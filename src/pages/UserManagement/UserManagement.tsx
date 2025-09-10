import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  fetchAllUsers,
  toggleUserStatusDeactivate,
  toggleUserStatusActivate,
} from "../../api/userApi";
import { User, UserLoggedData } from "../../types/UserTypes";
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
import { Upload } from "@mui/icons-material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ReusableTabs, { TabConfig } from "@/components/ReusableTabs";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "user_name",
    headerName: "Username",
    flex: 1.2,
    cellClassName: "name-column--cell",
  },
  {
    field: "first_name",
    headerName: "First Name",
    flex: 1,
  },
  {
    field: "last_name",
    headerName: "Last Name",
    flex: 1,
  },
  {
    field: "role_name",
    headerName: "Role",
    flex: 1,
  },
  {
    field: "emp_number",
    headerName: "Employee #",
    flex: 1,
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1.5,
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

const mobileHiddenUserFields = [
  "id",
  "emp_number",
  "module_name",
  "action_name",
  "location_name",
  "created_user",
  "created_at",
];
const nonMobileHiddenUserFields = ["id", "action_name"];

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const defTabIndex = state?.currentTabIndex;
  const [dataRows, setDataRows] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  const [currentTabIndex, setCurrentTabIndex] = useState<0 | 1 | 2>(
    defTabIndex as 0 | 1 | 2
  );

  // Permission context
  const {
    canViewModule,
    canPostInModule,
    loading: permissionsLoading,
    fullUserData,
  } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;
  const currentUserRole = typedUserData?.role;
  const currentUserRoleLevel = currentUserRole?.role_level;
  const hasViewPermission = canViewModule("users");

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(
    null
  );

  // Reset password state
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(
    null
  );
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    confirm_password: "",
  });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadUsersData = useCallback(async () => {
    setLoadingData(true);
    try {
      const users = await fetchAllUsers({ get });
      setDataRows(
        users.map((user) => {
          const canShowActions =
            typeof currentUserRoleLevel === "number" &&
            typeof user.role_level === "number" &&
            !isNaN(currentUserRoleLevel) &&
            !isNaN(user.role_level) &&
            user.role_level >= currentUserRoleLevel;
          // console.log(
          //   `User: ${user.user_name}, role_level: ${user.role_level}, currentUserRoleLevel: ${currentUserRoleLevel}, canShowActions: ${canShowActions}`
          // );
          return {
            ...user,
            id: user.id,
            user_name: user.user_name || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            role_name: user.role_name || "",
            emp_number: user.emp_number || "",
            email: user.email || "",
            module_name: user.module_name || [],
            action_name: user.action_name || [],
            location_name: user.location_name || [],
            status_name:
              user.status_name ||
              (user.status_id === 1 ? "ACTIVE" : "INACTIVE"),
            created_user: user.created_user || "",
            created_at: user.created_at || "",
            canShowActions,
          };
        })
      );

      // console.log("Users ", users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get, currentUserRoleLevel]);

  useEffect(() => {
    loadUsersData();
  }, [loadUsersData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: User) => {
      console.log(`Edit User with ID:`, id, `Data:`, rowData);
      navigate("/user-form", { state: { userId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: User) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setUserToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setUserToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (userToToggleStatus) {
      try {
        const newStatusId = userToToggleStatus.status_id === 1 ? 2 : 1;

        const toggleFunction =
          newStatusId === 2
            ? toggleUserStatusDeactivate
            : toggleUserStatusActivate;
        await toggleFunction(
          { patch },
          userToToggleStatus.id.toString(),
          newStatusId,
          userToToggleStatus.user_name
        );
        await loadUsersData();
        setOpenToggleStatusDialog(false);
        setUserToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling user status:", error);
      }
    }
  }, [userToToggleStatus, loadUsersData, patch]);

  const handleNew = useCallback(() => {
    // console.log("Add New User");
    navigate("/user-form");
  }, [navigate]);

  const handleUploadUsers = useCallback(() => {
    navigate("/user-upload");
  }, [navigate]);

  // Reset password handlers
  const handleResetPassword = useCallback(
    (_id: string | number, rowData: User) => {
      setUserToResetPassword(rowData);
      setOpenResetPasswordDialog(true);
      setResetPasswordData({ password: "", confirm_password: "" });
      setResetPasswordError(null);
    },
    []
  );

  const handleCloseResetPasswordDialog = useCallback(() => {
    setOpenResetPasswordDialog(false);
    setUserToResetPassword(null);
    setResetPasswordData({ password: "", confirm_password: "" });
    setResetPasswordError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleConfirmResetPassword = useCallback(async () => {
    if (!userToResetPassword) return;

    // Validate passwords
    if (!resetPasswordData.password || !resetPasswordData.confirm_password) {
      setResetPasswordError("Please fill in both password fields");
      return;
    }

    if (resetPasswordData.password.length <= 6) {
      setResetPasswordError("Password must be more than 6 characters");
      return;
    }

    if (resetPasswordData.password !== resetPasswordData.confirm_password) {
      setResetPasswordError("Passwords do not match");
      return;
    }

    if (resetPasswordData.password.length < 6) {
      setResetPasswordError("Password must be at least 6 characters long");
      return;
    }

    setResetPasswordLoading(true);
    setResetPasswordError(null);

    try {
      await apiInstance.put(`/users/${userToResetPassword.id}/reset-password`, {
        password: resetPasswordData.password,
        confirm_password: resetPasswordData.confirm_password,
      });

      handleCloseResetPasswordDialog();
      // Optionally show success message
    } catch (error) {
      console.error("Error resetting password:", error);
      let message = "Failed to reset password";
      if (typeof error === "object" && error !== null) {
        if (
          "response" in error &&
          typeof (error as Record<string, unknown>).response === "object" &&
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message
        ) {
          message =
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || message;
        } else if (error instanceof Error) {
          message = error.message;
        }
      }
      setResetPasswordError(message);
    } finally {
      setResetPasswordLoading(false);
    }
  }, [
    userToResetPassword,
    resetPasswordData,
    apiInstance,
    handleCloseResetPasswordDialog,
  ]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newTabIndex: number) => {
      setCurrentTabIndex(newTabIndex as 0 | 1 | 2);
    },
    []
  );

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "users",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit User",
    activateTooltip: "Activate User",
    deactivateTooltip: "Deactivate User",
  });

  // Create combined actions array with custom reset password action
  const allActions = useMemo(() => {
    const actions = [...buttonActionGrid.actions];

    // Add reset password action if user has post permission
    if (canPostInModule("users")) {
      actions.push({
        type: "reset-password",
        icon: VpnKeyIcon,
        tooltip: "Reset Password",
        onClick: handleResetPassword,
        color: "warning" as const,
        ariaLabel: "reset-password",
      });
    }

    return actions;
  }, [buttonActionGrid.actions, canPostInModule, handleResetPassword]);

  const columns: GridColDef<User>[] = useMemo(() => {
    const generatedColumns = mapColumnConfigToGridColDef<User>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<User>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          // Only show actions if canShowActions is true
          if (!rowData.canShowActions) return null;

          return (
            <DatagridActions<User>
              rowId={id}
              actions={allActions}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [allActions]);

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {userToToggleStatus?.status_id === 1 ? " deactivate" : " activate"} User
        "<strong>{userToToggleStatus?.user_name || "this user"}</strong>"? This
        action cannot be undone.
      </>
    ),
    [userToToggleStatus?.status_id, userToToggleStatus?.user_name]
  );

  const dialogTitle = useMemo(
    () => (userToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation"),
    [userToToggleStatus?.status_id]
  );

  // Filter dataRows by status_id
  const activeRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 1),
    [dataRows]
  );
  const inActiveRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 2),
    [dataRows]
  );

  const tabs: TabConfig[] = [
    {
      label: "Active",
      // icon: <PeopleOutlineOutlinedIcon />,
      content: (
        <CustomDataGrid<User>
          key="active-users-datagrid"
          rows={activeRows}
          columns={columns}
          getRowId={(row: User) => row.id}
          initialMobileHiddenFields={mobileHiddenUserFields}
          initialNonMobileHiddenFields={nonMobileHiddenUserFields}
          loading={loadingData}
        />
      ),
    },
    {
      label: "Inactive",
      content: (
        <CustomDataGrid<User>
          key="inactive-users-datagrid"
          rows={inActiveRows}
          columns={columns}
          getRowId={(row: User) => row.id}
          initialMobileHiddenFields={mobileHiddenUserFields}
          initialNonMobileHiddenFields={nonMobileHiddenUserFields}
          loading={loadingData}
        />
      ),
    },
  ];

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Users" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="USER MANAGEMENT"
        subtitle="Manage system users"
        actionButton={
          <>
            <HeaderActionButton moduleAlias="users" onClick={handleNew} />
            <HeaderActionButton
              moduleAlias="users"
              onClick={handleUploadUsers}
              icon={Upload}
              text="Upload"
            />
            {/* <Button
              variant="contained"
              color="secondary"
              sx={{ ml: 2 }}
              onClick={handleUploadUsers}
              icon={UploadOutlinedIcon}
            >
              Upload Users
            </Button> */}
          </>
        }
      />

      <ReusableTabs
        value={currentTabIndex}
        tabs={tabs}
        onChange={handleTabChange}
      />

      <ConfirmationDialog
        open={openToggleStatusDialog}
        onClose={handleCloseToggleStatusDialog}
        onConfirm={handleConfirmToggleStatus}
        message={dialogMessage}
        title={dialogTitle}
      />

      {/* Reset Password Dialog */}
      <Dialog
        open={openResetPasswordDialog}
        onClose={handleCloseResetPasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Reset password for user:{" "}
            <strong>{userToResetPassword?.user_name}</strong>
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            variant="outlined"
            value={resetPasswordData.password}
            onChange={(e) =>
              setResetPasswordData((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            error={!!resetPasswordError}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="dense"
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            variant="outlined"
            value={resetPasswordData.confirm_password}
            onChange={(e) =>
              setResetPasswordData((prev) => ({
                ...prev,
                confirm_password: e.target.value,
              }))
            }
            error={!!resetPasswordError}
            helperText={resetPasswordError}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseResetPasswordDialog}
            disabled={resetPasswordLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResetPassword}
            variant="contained"
            disabled={resetPasswordLoading}
            color="warning"
          >
            {resetPasswordLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
