import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputSelectField from "@/components/InputSelectField";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import InputCheckBoxField from "@/components/InputCheckBoxField";
import { PermissionsMatrixTable } from "@/components/PermissionsMatrixTable";
import { useUserFormPermissionsMatrix } from "@/hooks/useUserFormPermissionsMatrix";
import { UserFormValues, UserLoggedData } from "@/types/UserTypes";
import {
  RoleActionPreset,
  RoleFromActionPreset,
  Role,
} from "@/types/RoleTypes";
import { Module } from "@/types/ModuleTypes";
import { Action } from "@/types/ActionTypes";
import { Location } from "@/types/LocationTypes";
import { AccessKey } from "@/types/AccessKeyTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchRoleActionPresets, fetchAllRoles } from "@/api/roleApi";
import { fetchAllModules } from "@/api/moduleApi";
import { fetchAllActions } from "@/api/actionApi";
import { fetchAllLocations } from "@/api/locationApi";
import { fetchAllAccessKeys } from "@/api/accessKeyApi";
import {
  createUser,
  updateUser,
  fetchNestedRolePreset,
  fetchUserNestedById,
} from "@/api/userApi";
import PermissionGuard from "@/components/PermissionGuard";
import { useUserPermissions } from "@/hooks/useUserPermissions";

// Status options for radio buttons
const statusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Theme options expand this based on available themes)
const themeOptions = [
  { value: 1, label: "Light Theme" },
  { value: 2, label: "Dark Theme" },
  //   { value: 3, label: "Light Theme" },
];

// User Details Step Component
const UserDetailsStep: React.FC<
  StepComponentProps<UserFormValues> & {
    isEditMode?: boolean;
    originalRoleId?: number | null;
    originalUserPermissions?: Array<{
      module_ids: number;
      action_ids: number[];
    }> | null;
    currentUserRoleLevel?: number | null;
  }
> = ({
  values,
  formikProps,
  isEditMode = false,
  originalRoleId = null,
  originalUserPermissions = null,
  currentUserRoleLevel = null,
}) => {
  const [roles, setRoles] = useState<RoleFromActionPreset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading roles, locations, and users...");

        // Load roles from role-action-presets endpoint
        const roleActionPresetsResponse = await fetchRoleActionPresets({ get });
        console.log("Role action presets response:", roleActionPresetsResponse);

        // Filter active role presets and extract unique roles
        const activeRolePresets = roleActionPresetsResponse.filter(
          (preset: RoleActionPreset) => preset.status_id === 1
        );

        // Extract unique roles from active presets
        const uniqueRolesMap = new Map<number, RoleFromActionPreset>();
        activeRolePresets.forEach((preset: RoleActionPreset) => {
          // Only include roles with role_level >= currentUserRoleLevel
          if (
            typeof currentUserRoleLevel === "number" &&
            preset.role_level !== undefined &&
            preset.role_level >= currentUserRoleLevel
          ) {
            if (!uniqueRolesMap.has(preset.role_id)) {
              uniqueRolesMap.set(preset.role_id, {
                id: preset.role_id,
                role_name: preset.role_name,
                status_id: preset.status_id,
                status_name: preset.status_name,
                role_level: preset.role_level,
              });
            }
          }
        });

        const activeRoles = Array.from(uniqueRolesMap.values());
        console.log("Active roles from presets:", activeRoles);
        setRoles(activeRoles);

        // Load locations
        const locationsResponse = await fetchAllLocations({ get });
        console.log("Locations response:", locationsResponse);
        const locationsArray = Array.isArray(locationsResponse)
          ? locationsResponse
          : (locationsResponse as { data: Location[] })?.data || [];
        const activeLocations = locationsArray.filter(
          (location: Location) => location.status_id === 1
        );
        console.log("Active locations:", activeLocations);
        setLocations(activeLocations);

        // Load access keys
        const accessKeysResponse = await fetchAllAccessKeys({ get });
        console.log("Access keys response:", accessKeysResponse);
        const activeAccessKeys = accessKeysResponse.filter(
          (accessKey: AccessKey) => accessKey.status_id === 1
        );
        console.log("Active access keys:", activeAccessKeys);
        setAccessKeys(activeAccessKeys);

        // Load users for upline selection (optional - only if needed)
        // implement fetchAllUsers if needed for user_upline_id selection
        // const usersResponse = await fetchAllUsers({ get });
        // setUsers(usersResponse);

        setError(null);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to load data");
        setError(errorMessage);
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [get, currentUserRoleLevel]); // Handle role change to fetch role-based permissions (only in create mode)

  useEffect(() => {
    const fetchRolePermissions = async (roleId: number) => {
      // In edit mode, only load role-based permissions if the role has actually changed
      if (isEditMode) {
        if (originalRoleId === null) {
          // Original role not loaded yet, skip for now
          console.log(
            "Original role not loaded yet, skipping role-based permission loading"
          );
          return;
        }
        if (originalRoleId === roleId) {
          // Role hasn't changed OR role has been changed back to original, restore original user permissions
          console.log(
            "Role is back to original in edit mode, restoring original user custom permissions"
          );

          // Restore original user permissions
          if (originalUserPermissions) {
            formikProps.setFieldValue(
              "user_permission_presets",
              originalUserPermissions
            );
            console.log(
              "🔧 Restored original user permissions:",
              originalUserPermissions
            );
          }

          return;
        }

        // Role has changed, load new role-based permissions
        console.log(
          `Role changed from ${originalRoleId} to ${roleId}, loading new role-based permissions`
        );
      }

      if (roleId > 0) {
        try {
          console.log("Fetching permissions for role:", roleId);

          // Fetch role-based permissions using GET /role-presets/nested/:role_id
          const rolePresetData = await fetchNestedRolePreset({ get }, roleId);

          if (rolePresetData) {
            console.log("Role preset data received:", rolePresetData);

            // Update locations with role-based locations
            // API now returns location_ids directly as array of numbers
            const locationIds = rolePresetData.location_ids || [];
            formikProps.setFieldValue("location_ids", locationIds);

            // Update permissions with role-based modules and actions
            // API now returns presets with module_ids and action_ids
            const permissionPresets = rolePresetData.presets || [];
            console.log("Setting permission presets:", permissionPresets);

            formikProps.setFieldValue(
              "user_permission_presets",
              permissionPresets
            );

            console.log(`Updated form with role-based data:`, {
              locationIds,
              permissionPresets,
              mode: isEditMode ? "edit (role changed)" : "create",
            });
          } else {
            console.log("No role preset data found, clearing permissions");
            // Clear permissions if no role preset found
            formikProps.setFieldValue("user_permission_presets", []);
          }
        } catch (error) {
          console.error("Error fetching role permissions:", error);
          // On error, clear permissions to allow manual configuration
          formikProps.setFieldValue("user_permission_presets", []);
        }
      } else {
        // Clear permissions when no role selected
        formikProps.setFieldValue("user_permission_presets", []);
      }
    };
    if (values.role_id && values.role_id > 0) {
      fetchRolePermissions(values.role_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.role_id, get, isEditMode, originalRoleId]); // Intentionally exclude formikProps and originalUserPermissions to prevent loops

  const roleOptions = useMemo(() => {
    const options = roles.map((role) => ({
      value: role.id,
      label: role.role_name,
    }));
    console.log("Role options:", options);
    return options;
  }, [roles]);
  const locationOptions = useMemo(() => {
    const options = locations.map((location) => ({
      value: location.id,
      label: location.location_name,
    }));
    console.log("Location options:", options);
    return options;
  }, [locations]);
  const accessKeyOptions = useMemo(() => {
    const options = accessKeys.map((accessKey) => ({
      value: accessKey.id,
      label: accessKey.access_key_name,
    }));
    console.log("Access key options:", options);
    return options;
  }, [accessKeys]);

  // Check if current role is inactive (not available in active roles)
  const isCurrentRoleInactive = useMemo(() => {
    if (isEditMode && values.role_id > 0) {
      const availableRoleIds = roles.map((role) => role.id);
      return !availableRoleIds.includes(values.role_id);
    }
    return false;
  }, [isEditMode, values.role_id, roles]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns={{
        xs: "1fr", // Single column on extra small screens
        sm: "repeat(2, 1fr)", // Two columns on small screens
        md: "repeat(4, minmax(0, 1fr))", // Four columns on medium and larger screens
      }}
    >
      {" "}
      {/* Personal Information */}{" "}
      <InputTextField
        name="user_name"
        label="Username"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />{" "}
      <InputTextField
        name="emp_number"
        label="Employee Number"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />{" "}
      <InputTextField
        name="first_name"
        label="First Name"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputTextField
        name="last_name"
        label="Last Name"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputTextField
        name="middle_name"
        label="Middle Name"
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      />{" "}
      <InputTextField
        name="email"
        label="Email"
        type="email"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      />{" "}
      {/* Password Field */}
      <InputTextField
        name="password"
        label={
          isEditMode ? "Password (leave blank to keep current)" : "Password"
        }
        type="password"
        required={!isEditMode}
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      />{" "}
      {/* Role and System Settings */}
      <InputSelectField
        name="role_id"
        label="Role"
        options={roleOptions}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 1",
          },
        }}
      />
      {/* Warning message for inactive role */}
      {isCurrentRoleInactive && (
        <Box
          sx={{
            gridColumn: {
              xs: "span 1",
              sm: "span 1",
              md: "span 1",
            },
            p: 2,
            bgcolor: "warning.light",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "warning.main",
          }}
        >
          <Typography variant="body2" color="warning.dark">
            ⚠️ <strong>Warning:</strong> This user is currently assigned to an
            inactive role. The role is no longer available for new assignments.
            Consider updating to an active role to ensure the user has proper
            access permissions.
          </Typography>
        </Box>
      )}
      <InputSelectField
        name="theme_id"
        label="Theme"
        options={themeOptions}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 1",
          },
        }}
      />{" "}
      {/* Locations */}
      <InputMultiSelectField
        name="location_ids"
        label="Locations"
        options={locationOptions}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      />
      {/* Access Keys */}
      <InputMultiSelectField
        name="access_key_id"
        label="Access Keys"
        options={accessKeyOptions}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      />{" "}
      {/* User Settings */}
      <InputCheckBoxField
        name="user_reset"
        label="Require Password Reset"
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputCheckBoxField
        name="email_switch"
        label="Enable Email Notifications"
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />{" "}
      <Box
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 2",
            md: "span 2",
          },
        }}
      >
        <InputRadioGroupField<1 | 2>
          name="status_id"
          label="Status"
          options={statusOptions}
          required
        />
      </Box>
    </Box>
  );
};

// Permissions Matrix Step Component
const PermissionsMatrixStep: React.FC<
  StepComponentProps<UserFormValues> & {
    isEditMode?: boolean;
    originalRoleId?: number | null;
    originalUserPermissions?: Array<{
      module_ids: number;
      action_ids: number[];
    }> | null;
    currentUserRoleLevel?: number | null;
  }
> = ({
  values,
  formikProps,
  isEditMode = false,
  originalRoleId = null,
  originalUserPermissions = null,
  currentUserRoleLevel = null,
}) => {
  const {
    actions,
    filteredModules,
    searchQuery,
    setSearchQuery,
    handlePermissionChange,
    isPermissionChecked,
    handleColumnToggle,
    handleRowToggle,
    error,
    isRoleBasedView,
  } = useUserFormPermissionsMatrix({
    values,
    formikProps,
    isEditMode,
    originalRoleId,
    originalUserPermissions,
  });

  const readOnly = currentUserRoleLevel !== null && currentUserRoleLevel > 2;

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <PermissionsMatrixTable
      title="User Permissions Matrix"
      description={
        isRoleBasedView
          ? "Configure permissions for this user. The matrix shows modules and actions available for the selected role. Changes will override the default role permissions."
          : "Configure specific permissions for this user. These will override the default role permissions."
      }
      instructions="Toggle check all columns by clicking the permission header cell, Toggle check all rows by clicking the module name cell."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      modules={filteredModules}
      actions={actions}
      onPermissionChange={handlePermissionChange}
      isPermissionChecked={isPermissionChecked}
      onColumnToggle={handleColumnToggle}
      onRowToggle={handleRowToggle}
      additionalContent={
        isRoleBasedView ? (
          <Typography
            variant="body2"
            color="info.main"
            gutterBottom
            sx={{ mb: 2 }}
          >
            📋 Role-based permissions are pre-populated. You can modify them as
            needed for this user.
          </Typography>
        ) : null
      }
      readOnly={readOnly}
    />
  );
};

// Review Step Component
const ReviewUserStep: React.FC<StepComponentProps<UserFormValues>> = ({
  values,
}) => {
  const [roleDetails, setRoleDetails] = useState<RoleFromActionPreset | null>(
    null
  );
  const [locationDetails, setLocationDetails] = useState<Location[]>([]);
  const [accessKeyDetails, setAccessKeyDetails] = useState<AccessKey[]>([]);
  const [moduleDetails, setModuleDetails] = useState<Module[]>([]);
  const [actionDetails, setActionDetails] = useState<Action[]>([]);
  const { get } = useApi();

  useEffect(() => {
    const loadDetails = async () => {
      try {
        // Load role details
        if (values.role_id > 0) {
          // For review step, use fetchAllRoles to get both active and inactive roles
          // This ensures we can display the role name even if the role is inactive
          const rolesResponse = await fetchAllRoles({ get });
          const role = rolesResponse.find((r: Role) => r.id === values.role_id);

          if (role) {
            // Convert Role to RoleFromActionPreset format for consistency
            setRoleDetails({
              id: role.id,
              role_name: role.role_name,
              status_id: role.status_id,
              status_name: role.status_name,
            });
          } else {
            setRoleDetails(null);
          }
        } // Load location details
        if (values.location_ids?.length > 0) {
          const locationsResponse = await fetchAllLocations({ get });
          const locationsArray = Array.isArray(locationsResponse)
            ? locationsResponse
            : (locationsResponse as { data: Location[] })?.data || [];
          const selectedLocations = locationsArray.filter((l: Location) =>
            values.location_ids.includes(l.id)
          );
          setLocationDetails(selectedLocations);
        } // Load access key details
        if (values.access_key_id && values.access_key_id.length > 0) {
          const accessKeysResponse = await fetchAllAccessKeys({ get });
          const selectedAccessKeys = accessKeysResponse.filter(
            (ak: AccessKey) => values.access_key_id!.includes(ak.id)
          );
          setAccessKeyDetails(selectedAccessKeys);
        }

        // Load module and action details for permissions
        if (values.user_permission_presets?.length > 0) {
          const modulesResponse = await fetchAllModules({ get });
          const actionsResponse = await fetchAllActions({ get });
          const actionsArray = Array.isArray(actionsResponse)
            ? actionsResponse
            : (actionsResponse as { data: Action[] })?.data || [];

          const moduleIds = values.user_permission_presets.map(
            (p) => p.module_ids
          );
          const selectedModules = modulesResponse.filter((m: Module) =>
            moduleIds.includes(m.id)
          );
          setModuleDetails(selectedModules);

          const actionIds = values.user_permission_presets.flatMap(
            (p) => p.action_ids
          );
          const selectedActions = actionsArray.filter((a: Action) =>
            actionIds.includes(a.id)
          );
          setActionDetails(selectedActions);
        }
      } catch (error) {
        console.error("Error loading details:", error);
      }
    };

    loadDetails();
  }, [get, values]);

  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      statusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  const getThemeLabel = (themeId: number) => {
    return (
      themeOptions.find((opt) => opt.value === themeId)?.label ||
      `Theme ${themeId}`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review User Details
      </Typography>
      {/* Personal Information */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Personal Information
      </Typography>
      <Typography variant="body2">
        <strong>Username:</strong> {values.user_name}
      </Typography>
      <Typography variant="body2">
        <strong>Full Name:</strong>{" "}
        {`${values.first_name} ${
          values.middle_name ? values.middle_name + " " : ""
        }${values.last_name}`}
      </Typography>
      <Typography variant="body2">
        <strong>Employee Number:</strong> {values.emp_number}
      </Typography>
      <Typography variant="body2">
        <strong>Email:</strong> {values.email}
      </Typography>
      {/* Role and System Information */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Role & System Settings
      </Typography>{" "}
      <Typography variant="body2">
        <strong>Role:</strong>{" "}
        {roleDetails ? (
          <>
            {roleDetails.role_name}
            {roleDetails.status_id === 2 && (
              <Typography
                component="span"
                color="warning.main"
                sx={{ ml: 1, fontWeight: "bold" }}
              >
                (Inactive Role)
              </Typography>
            )}
          </>
        ) : (
          "Loading..."
        )}
      </Typography>
      {roleDetails && roleDetails.status_id === 2 && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
          ⚠️ This user is assigned to an inactive role. Consider updating to an
          active role or the user may have limited functionality.
        </Typography>
      )}
      <Typography variant="body2">
        <strong>Theme:</strong> {getThemeLabel(values.theme_id)}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status_id as 1 | 2)}
      </Typography>{" "}
      {/* Location Information */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Location Access
      </Typography>
      <Typography variant="body2">
        <strong>Locations:</strong>{" "}
        {locationDetails.length > 0
          ? locationDetails.map((l) => l.location_name).join(", ")
          : "Loading..."}
      </Typography>
      {/* Access Keys Information */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Access Keys
      </Typography>{" "}
      <Typography variant="body2">
        <strong>Access Keys:</strong>{" "}
        {values.access_key_id &&
        values.access_key_id.length > 0 &&
        accessKeyDetails.length > 0
          ? accessKeyDetails.map((ak) => ak.access_key_name).join(", ")
          : values.access_key_id && values.access_key_id.length > 0
          ? "Loading..."
          : "None assigned"}
      </Typography>
      {/* User Settings */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        User Settings
      </Typography>
      <Typography variant="body2">
        <strong>Require Password Reset:</strong>{" "}
        {values.user_reset ? "Yes" : "No"}
      </Typography>
      <Typography variant="body2">
        <strong>Email Notifications:</strong>{" "}
        {values.email_switch ? "Enabled" : "Disabled"}
      </Typography>{" "}
      {/* Permissions Summary */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Permission Configuration
      </Typography>
      {values.role_id && values.role_id > 0 && (
        <Typography variant="body2" color="info.main" gutterBottom>
          📋 This user inherits default permissions from the selected role.
        </Typography>
      )}
      {values.user_permission_presets?.length > 0 ? (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Custom Permissions:</strong>
          </Typography>
          {values.user_permission_presets.map((preset, index) => {
            const module = moduleDetails.find(
              (m) => m.id === preset.module_ids
            );
            const presetActions = actionDetails.filter((a) =>
              preset.action_ids.includes(a.id)
            );

            return (
              <Box key={index} sx={{ ml: 2, mb: 1 }}>
                <Typography variant="body2">
                  <strong>
                    {module?.module_name || `Module ${preset.module_ids}`}:
                  </strong>{" "}
                  {presetActions.map((a) => a.action_name).join(", ")}
                </Typography>
              </Box>
            );
          })}
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            ⚠️ Custom permissions will override role-based defaults for this
            user.
          </Typography>
        </>
      ) : (
        <Typography variant="body2" color="textSecondary">
          No custom permissions configured. User will inherit all permissions
          from the selected role.
        </Typography>
      )}
    </Box>
  );
};

const UserForm: React.FC = () => {
  const [userData, setUserData] = useState<UserFormValues | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [originalRoleId, setOriginalRoleId] = useState<number | null>(null);
  const [originalUserPermissions, setOriginalUserPermissions] = useState<Array<{
    module_ids: number;
    action_ids: number[];
  }> | null>(null);

  const navigate = useNavigate();
  const { state } = useLocation();
  const userId = state?.userId;
  const isEditMode = Boolean(userId);
  const formHeaderTitle = isEditMode ? "Edit User" : "Add User";

  const { fullUserData } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;
  const currentUserRole = typedUserData?.role;
  const currentUserRoleLevel = currentUserRole?.role_level;

  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  // Create a wrapper component for UserDetailsStep that has access to isEditMode
  const UserDetailsStepWithEditMode: React.FC<
    StepComponentProps<UserFormValues>
  > = useCallback(
    (props) => {
      return (
        <UserDetailsStep
          {...props}
          isEditMode={isEditMode}
          originalRoleId={originalRoleId}
          originalUserPermissions={originalUserPermissions}
          currentUserRoleLevel={currentUserRoleLevel}
        />
      );
    },
    [isEditMode, originalRoleId, originalUserPermissions, currentUserRoleLevel]
  );

  // Create a wrapper component for PermissionsMatrixStep that has access to isEditMode
  const PermissionsMatrixStepWithEditMode: React.FC<
    StepComponentProps<UserFormValues>
  > = useCallback(
    (props) => {
      return (
        <PermissionsMatrixStep
          {...props}
          isEditMode={isEditMode}
          originalRoleId={originalRoleId}
          originalUserPermissions={originalUserPermissions}
          currentUserRoleLevel={currentUserRoleLevel}
        />
      );
    },
    [isEditMode, originalRoleId, originalUserPermissions, currentUserRoleLevel]
  );
  const loadUserData = useCallback(async () => {
    if (isEditMode && userId) {
      setLoadingUserData(true);
      try {
        const data = await fetchUserNestedById({ get }, userId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status.id === 1 || data.status.id === 2 ? data.status.id : 1;

          // Extract location IDs from locations array
          const locationIds = data.locations.map((location) => location.id);

          // Extract access key IDs from access_keys array
          const accessKeyIds = data.access_keys.map(
            (accessKey) => accessKey.id
          ); // Convert user permissions from nested modules/actions to form format
          const userPermissionPresets = data.modules
            .filter((module) => module.actions && module.actions.length > 0)
            .map((module) => ({
              module_ids: module.id,
              action_ids: module.actions
                .filter((action) => action.permission_status_id === 1)
                .map((action) => action.id),
            }))
            .filter((preset) => preset.action_ids.length > 0);

          console.log("🔧 Edit Mode - User permissions loaded:", {
            rawModules: data.modules,
            userPermissionPresets,
            locationIds,
            accessKeyIds,
          });
          setUserData({
            user_name: data.user.user_name,
            first_name: data.user.first_name,
            middle_name: data.user.middle_name || undefined,
            last_name: data.user.last_name,
            role_id: data.role.id,
            emp_number: data.user.emp_number,
            email: data.user.email,
            user_reset: data.user.user_reset,
            user_upline_id: data.user.user_upline_id || undefined,
            email_switch: data.user.email_switch,
            status_id: mappedStatus,
            theme_id: data.theme.id,
            profile_pic_url: data.user.profile_pic_url || "",
            location_ids: locationIds,
            user_permission_presets: userPermissionPresets,
            access_key_id: accessKeyIds,
          }); // Store the original role ID for comparison in edit mode
          setOriginalRoleId(data.role.id);

          // Store the original user permissions for restoration when role changes back
          setOriginalUserPermissions(userPermissionPresets);
        } else {
          console.warn(`User with ID ${userId} not found.`);
          navigate("/users", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load user details"
        );
        console.error("Error loading user:", error, errorMessage);
        navigate("/users", { replace: true });
      } finally {
        setLoadingUserData(false);
      }
    } else {
      setLoadingUserData(false);
    }
  }, [isEditMode, userId, navigate, get]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const stepsConfig: FormStep<UserFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "User Details",
        component: UserDetailsStepWithEditMode,
        fields: [
          "user_name",
          "first_name",
          "middle_name",
          "last_name",
          "role_id",
          "emp_number",
          "email",
          "password",
          "user_reset",
          "user_upline_id",
          "email_switch",
          "status_id",
          "theme_id",
          "location_ids",
          "access_key_id",
        ],
      },
      {
        id: "permissions",
        title: "Permissions Matrix",
        component: PermissionsMatrixStepWithEditMode,
        fields: ["user_permission_presets"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewUserStep,
        fields: [],
      },
    ],
    [UserDetailsStepWithEditMode, PermissionsMatrixStepWithEditMode]
  );
  const initialValues: UserFormValues = useMemo(() => {
    const defaultValues: UserFormValues = {
      user_name: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      role_id: 0,
      emp_number: "",
      email: "",
      user_reset: false,
      user_upline_id: undefined,
      email_switch: true,
      status_id: 1,
      theme_id: 1,
      profile_pic_url: "",
      location_ids: [],
      user_permission_presets: [],
      // New optional fields
      password: "", // Required field for user creation
      created_by: undefined,
      access_key_id: undefined,
    };

    if (isEditMode && userData) {
      return {
        user_name: userData.user_name,
        first_name: userData.first_name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        emp_number: userData.emp_number,
        email: userData.email,
        user_reset: userData.user_reset,
        user_upline_id: userData.user_upline_id,
        email_switch: userData.email_switch,
        status_id: userData.status_id,
        theme_id: userData.theme_id,
        profile_pic_url: userData.profile_pic_url || "",
        location_ids: userData.location_ids,
        user_permission_presets: userData.user_permission_presets,
        // New optional fields with fallbacks
        password: userData.password,
        created_by: userData.created_by,
        access_key_id: userData.access_key_id,
      };
    }

    return defaultValues;
  }, [isEditMode, userData]);
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      user_name: Yup.string().required("Username is required"),
      first_name: Yup.string().required("First name is required"),
      middle_name: Yup.string().optional(),
      last_name: Yup.string().required("Last name is required"),
      role_id: Yup.number()
        .required("Role is required")
        .min(1, "Please select a Role"),
      emp_number: Yup.string().required("Employee number is required"),
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
      user_reset: Yup.boolean().required(),
      user_upline_id: Yup.number().optional(),
      email_switch: Yup.boolean().required(),
      theme_id: Yup.number()
        .required("Theme is required")
        .min(1, "Please select a Theme"),
      profile_pic_url: Yup.string().optional(),
      location_ids: Yup.array()
        .of(Yup.number().required())
        .min(1, "At least one location must be selected")
        .required("Locations are required"),
      user_permission_presets: Yup.array()
        .of(
          Yup.object().shape({
            module_ids: Yup.number().required(),
            action_ids: Yup.array()
              .of(Yup.number().required())
              .min(1, "At least one action must be selected")
              .required(),
          })
        )
        .default([]),
      status_id: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
      // Password is required only for user creation, optional for edit mode
      password: isEditMode
        ? Yup.string()
            .optional()
            .test(
              "password-rules",
              "If provided, password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
              function (value) {
                // If password is empty in edit mode, it's valid (no change)
                if (!value || value.length === 0) {
                  return true;
                }
                // If password is provided, validate it
                const hasMinLength = value.length >= 8;
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecialChar = /[@$!%*?&]/.test(value);

                return (
                  hasMinLength &&
                  hasUpperCase &&
                  hasLowerCase &&
                  hasNumber &&
                  hasSpecialChar
                );
              }
            )
        : Yup.string()
            .required("Password is required")
            .min(8, "Password must be at least 8 characters")
            .matches(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
      created_by: Yup.number().optional(),
      // access_key_id: Yup.array().of(Yup.number().required()).optional(),
      access_key_id: Yup.array()
        .of(Yup.number().required())
        .min(1, "At least one access key must be selected")
        .required("Access Keys are required"),
    });
  }, [isEditMode]);
  const handleSubmit = async (
    values: UserFormValues,
    formikHelpers: FormikHelpers<UserFormValues>
  ) => {
    try {
      // Convert form values to API format
      const apiPayload: UserFormValues = {
        user_name: values.user_name,
        first_name: values.first_name,
        middle_name: values.middle_name,
        last_name: values.last_name,
        role_id: values.role_id,
        emp_number: values.emp_number,
        email: values.email,
        user_reset: values.user_reset,
        user_upline_id: values.user_upline_id,
        email_switch: values.email_switch,
        status_id: +values.status_id as 1 | 2,
        theme_id: values.theme_id,
        profile_pic_url: values.profile_pic_url || "",
        location_ids: values.location_ids,
        user_permission_presets: values.user_permission_presets,
        // Include other optional fields if they have values
        ...(values.created_by && { created_by: values.created_by }),
        ...(values.access_key_id &&
          values.access_key_id.length > 0 && {
            access_key_id: values.access_key_id,
          }),
      };

      // Only include password if it's provided (create mode) or has a value (edit mode)
      if (
        !isEditMode ||
        (isEditMode && values.password && values.password.length > 0)
      ) {
        apiPayload.password = values.password;
      }

      if (isEditMode && userId) {
        console.log("Submitting updated User:", apiPayload, "ID:", userId);
        await updateUser({ put }, userId, apiPayload);
      } else {
        console.log("Submitting new User:", apiPayload);
        await createUser({ post }, apiPayload);
      }
      formikHelpers.resetForm();
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save user");
      console.error("Error saving user:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/users");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="users"
      isEditMode={isEditMode}
      loadingText="User Form"
    >
      <MultiStepForm<UserFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingUserData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/users"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Users List"
      />
    </PermissionGuard>
  );
};

export default UserForm;
