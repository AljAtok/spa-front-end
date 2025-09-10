import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputSelectField from "@/components/InputSelectField";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import InputCheckBoxField from "@/components/InputCheckBoxField";
import { PermissionsMatrixTable } from "@/components/PermissionsMatrixTable";
import { usePermissionsMatrix } from "@/hooks/usePermissionsMatrix";
import { RolePresetFormValues } from "@/types/RolePresetsTypes";
import { Role } from "@/types/RoleTypes";
import { Module } from "@/types/ModuleTypes";
import { Action } from "@/types/ActionTypes";
import { Location } from "@/types/LocationTypes";
import { UserInfo } from "@/types/UserTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchAllRoles, fetchAllRoleNotInPresets } from "@/api/roleApi";
import { fetchAllModules } from "@/api/moduleApi";
import { fetchAllActions } from "@/api/actionApi";
import { fetchAllLocations } from "@/api/locationApi";
import { fetchAllUsersByRole } from "@/api/userApi";
import {
  fetchRolePresetById,
  createRolePreset,
  updateRolePreset,
} from "@/api/rolePresetsApi";
import PermissionGuard from "@/components/PermissionGuard";

// Status options for radio buttons
const statusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Role Preset Details Step Component
const RolePresetDetailsStep: React.FC<
  StepComponentProps<RolePresetFormValues> & {
    isEditMode?: boolean;
  }
> = ({ isEditMode = false }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading roles and locations..."); // Load roles
        let rolesResponse: Role[];
        if (isEditMode) {
          rolesResponse = await fetchAllRoles({ get });
        } else {
          rolesResponse = await fetchAllRoleNotInPresets({ get });
          // rolesResponse = await fetchAllRoles({ get });
        }
        console.log("Roles response:", rolesResponse);
        const activeRoles = rolesResponse.filter(
          (role: Role) => role.status_id === 1
        );
        console.log("Active roles:", activeRoles);
        setRoles(activeRoles); // Load locations
        const locationsResponse = await fetchAllLocations({ get });
        console.log("Locations response:", locationsResponse);
        // Handle both array and object response formats
        const locationsArray = Array.isArray(locationsResponse)
          ? locationsResponse
          : (locationsResponse as { data: Location[] })?.data || [];
        const activeLocations = locationsArray.filter(
          (location: Location) => location.status_id === 1
        );
        console.log("Active locations:", activeLocations);
        setLocations(activeLocations);

        setError(null);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to load data");
        setError(errorMessage);
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [get, isEditMode]);
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

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns="repeat(4, minmax(0, 1fr))"
    >
      <InputSelectField
        name="role_id"
        label="Role"
        options={roleOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputMultiSelectField
        name="location_ids"
        label="Locations"
        options={locationOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status_id"
        label="Status"
        options={statusOptions}
        required
      />
    </Box>
  );
};

// Permissions Matrix Step Component
const PermissionsMatrixStep: React.FC<
  StepComponentProps<RolePresetFormValues>
> = ({ values, formikProps }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load modules
        const modulesResponse = await fetchAllModules({ get });
        const activeModules = modulesResponse.filter(
          (module: Module) => module.status_id === 1
        );
        setModules(activeModules);

        // Load actions
        const actionsResponse = await fetchAllActions({ get });
        // Handle both array and object response formats
        const actionsArray = Array.isArray(actionsResponse)
          ? actionsResponse
          : (actionsResponse as { data: Action[] })?.data || [];
        const activeActions = actionsArray.filter(
          (action: Action) => action.status_id === 1
        );
        setActions(activeActions);

        setError(null);
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load permissions data"
        );
        setError(errorMessage);
        console.error("Error loading permissions data:", error);
      }
    };
    loadData();
  }, [get]);

  const {
    searchQuery,
    setSearchQuery,
    filteredModules,
    handlePermissionChange,
    isPermissionChecked,
    handleColumnToggle,
    handleRowToggle,
  } = usePermissionsMatrix({
    modules,
    actions,
    presets: values.presets || [],
    setFieldValue: formikProps.setFieldValue,
    fieldName: "presets",
  });

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <PermissionsMatrixTable
      title="Module-Action Permissions Matrix"
      modules={filteredModules}
      actions={actions}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isPermissionChecked={isPermissionChecked}
      onPermissionChange={handlePermissionChange}
      onColumnToggle={handleColumnToggle}
      onRowToggle={handleRowToggle}
    />
  );
};

// User Selection Step Component
const UserSelectionStep: React.FC<StepComponentProps<RolePresetFormValues>> = ({
  values,
}) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { get } = useApi();

  useEffect(() => {
    const loadUsers = async () => {
      if (values.role_id && values.role_id > 0) {
        setLoading(true);
        try {
          console.log("Loading users for role:", values.role_id);
          const usersResponse = await fetchAllUsersByRole(
            { get },
            values.role_id
          );
          console.log("Users response:", usersResponse);
          setUsers(usersResponse);
          setError(null);
        } catch (error) {
          const errorMessage = getErrorMessage(error, "Failed to load users");
          setError(errorMessage);
          console.error("Error loading users:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUsers([]);
      }
    };

    loadUsers();
  }, [get, values.role_id]);

  const userOptions = useMemo(() => {
    const options = users.map((user) => ({
      value: user.id,
      label: user.full_name,
    }));
    console.log("User options:", options);
    return options;
  }, [users]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Users for Role Preset
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Choose users from the selected role (
        {values.role_id > 0 ? "ID: " + values.role_id : "No role selected"}) to
        apply this role preset to. Only users assigned to the selected role will
        be shown.
      </Typography>

      {loading ? (
        <Typography>Loading users...</Typography>
      ) : values.role_id <= 0 ? (
        <Typography color="warning.main">
          Please select a role in the previous step to see available users.
        </Typography>
      ) : users.length === 0 ? (
        <Typography color="textSecondary">
          No users found for the selected role.
        </Typography>
      ) : (
        <Box>
          <InputMultiSelectField
            name="user_ids"
            label="Users"
            options={userOptions}
            sx={{ gridColumn: "span 4", mt: 2 }}
          />
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 1, display: "block" }}
          >
            {users.length} user(s) available for selection
          </Typography>

          {/* Conditional checkbox fields - only show if users are selected */}
          {values.user_ids && values.user_ids.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Apply Settings to Selected Users
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Choose which settings should be applied to the{" "}
                {values.user_ids.length} selected user(s):
              </Typography>
              <InputCheckBoxField
                name="apply_permissions_to_users"
                label="Apply Permission Matrix to selected Users"
                sx={{ mb: 1 }}
              />

              <InputCheckBoxField
                name="apply_locations_to_users"
                label="Apply Location to selected Users"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// Review Step Component
const ReviewRolePresetStep: React.FC<
  StepComponentProps<RolePresetFormValues>
> = ({ values }) => {
  const [roleDetails, setRoleDetails] = useState<Role | null>(null);
  const [locationDetails, setLocationDetails] = useState<Location[]>([]);
  const [moduleDetails, setModuleDetails] = useState<Module[]>([]);
  const [actionDetails, setActionDetails] = useState<Action[]>([]);
  const [userDetails, setUserDetails] = useState<UserInfo[]>([]);
  const { get } = useApi();

  useEffect(() => {
    const loadDetails = async () => {
      try {
        // Load role details
        if (values.role_id > 0) {
          const rolesResponse = await fetchAllRoles({ get });
          const role = rolesResponse.find((r: Role) => r.id === values.role_id);
          setRoleDetails(role || null);
        }

        // Load location details
        if (values.location_ids?.length > 0) {
          const locationsResponse = await fetchAllLocations({ get });
          // Handle both array and object response formats
          const locationsArray = Array.isArray(locationsResponse)
            ? locationsResponse
            : (locationsResponse as { data: Location[] })?.data || [];
          const selectedLocations = locationsArray.filter((l: Location) =>
            values.location_ids.includes(l.id)
          );
          setLocationDetails(selectedLocations);
        }

        // Load module and action details for presets
        if (values.presets?.length > 0) {
          const modulesResponse = await fetchAllModules({ get });
          const actionsResponse = await fetchAllActions({ get });
          // Handle both array and object response formats
          const actionsArray = Array.isArray(actionsResponse)
            ? actionsResponse
            : (actionsResponse as { data: Action[] })?.data || [];

          const moduleIds = values.presets.map((p) => p.module_ids);
          const selectedModules = modulesResponse.filter((m: Module) =>
            moduleIds.includes(m.id)
          );
          setModuleDetails(selectedModules);
          const actionIds = values.presets.flatMap((p) => p.action_ids);
          const selectedActions = actionsArray.filter((a: Action) =>
            actionIds.includes(a.id)
          );
          setActionDetails(selectedActions);
        }

        // Load user details for selected users
        if (values.user_ids?.length > 0 && values.role_id > 0) {
          const usersResponse = await fetchAllUsersByRole(
            { get },
            values.role_id
          );
          const selectedUsers = usersResponse.filter((u: UserInfo) =>
            values.user_ids.includes(u.id)
          );
          setUserDetails(selectedUsers);
        }
      } catch (error) {
        console.error("Error loading details:", error);
      }
    };

    loadDetails();
  }, [get, values]);

  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      statusOptions.find((opt) => opt.value == statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Role Preset Details
      </Typography>
      <Typography variant="body2">
        <strong>Role:</strong>{" "}
        {roleDetails ? roleDetails.role_name : "Loading..."}
      </Typography>
      <Typography variant="body2">
        <strong>Locations:</strong>{" "}
        {locationDetails.length > 0
          ? locationDetails.map((l) => l.location_name).join(", ")
          : "Loading..."}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status_id as 1 | 2)}
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Permissions Summary
      </Typography>
      {values.presets?.map((preset, index) => {
        const module = moduleDetails.find((m) => m.id === preset.module_ids);
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
            </Typography>{" "}
          </Box>
        );
      })}

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Selected Users
      </Typography>
      {values.user_ids?.length > 0 ? (
        userDetails.length > 0 ? (
          userDetails.map((user, index) => (
            <Box key={index} sx={{ ml: 2, mb: 1 }}>
              <Typography variant="body2">
                • {user.full_name} {user.role_name ? `(${user.role_name})` : ""}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading user details...
          </Typography>
        )
      ) : (
        <Typography variant="body2" sx={{ ml: 2 }} color="textSecondary">
          No users selected for this role preset.
        </Typography>
      )}

      {/* Show apply settings if users are selected */}
      {values.user_ids?.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Apply Settings
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            <strong>Apply Permission Matrix to selected Users:</strong>{" "}
            {values.apply_permissions_to_users ? "Yes" : "No"}
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            <strong>Apply Location to selected Users:</strong>{" "}
            {values.apply_locations_to_users ? "Yes" : "No"}
          </Typography>
        </>
      )}
    </Box>
  );
};

const RolePresetForm: React.FC = () => {
  const [rolePresetData, setRolePresetData] =
    useState<RolePresetFormValues | null>(null);
  const [loadingRolePresetData, setLoadingRolePresetData] =
    useState<boolean>(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const rolePresetId = state?.rolePresetId;
  const isEditMode = Boolean(rolePresetId);
  const formHeaderTitle = isEditMode ? "Edit Role Preset" : "Add Role Preset";

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
  const RolePresetDetailsStepWithEditMode: React.FC<
    StepComponentProps<RolePresetFormValues>
  > = useCallback(
    (props) => {
      return <RolePresetDetailsStep {...props} isEditMode={isEditMode} />;
    },
    [isEditMode]
  );

  const loadRolePresetData = useCallback(async () => {
    if (isEditMode && rolePresetId) {
      setLoadingRolePresetData(true);
      try {
        const data = await fetchRolePresetById({ get }, rolePresetId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;
          setRolePresetData({
            role_id: data.role_id,
            location_ids: data.location_ids || [],
            presets: data.presets || [],
            status_id: mappedStatus,
            user_ids: data.user_ids || [],
            apply_permissions_to_users:
              data.apply_permissions_to_users || false,
            apply_locations_to_users: data.apply_locations_to_users || false,
          });
        } else {
          console.warn(`Role preset with ID ${rolePresetId} not found.`);
          navigate("/role-presets", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load role preset details"
        );
        console.error("Error loading role preset:", error, errorMessage);
        navigate("/role-presets", { replace: true });
      } finally {
        setLoadingRolePresetData(false);
      }
    } else {
      setLoadingRolePresetData(false);
    }
  }, [isEditMode, rolePresetId, navigate, get]);

  useEffect(() => {
    loadRolePresetData();
  }, [loadRolePresetData]);
  const stepsConfig: FormStep<RolePresetFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Role Preset Details",
        component: RolePresetDetailsStepWithEditMode,
        fields: ["role_id", "location_ids", "status_id"],
      },
      {
        id: "permissions",
        title: "Permissions Matrix",
        component: PermissionsMatrixStep,
        fields: ["presets"],
      },
      {
        id: "users",
        title: "User Selection",
        component: UserSelectionStep,
        fields: [
          "user_ids",
          "apply_permissions_to_users",
          "apply_locations_to_users",
        ],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewRolePresetStep,
        fields: [],
      },
    ],
    [RolePresetDetailsStepWithEditMode]
  );
  const initialValues: RolePresetFormValues = useMemo(() => {
    const defaultValues: RolePresetFormValues = {
      role_id: 0,
      location_ids: [],
      presets: [],
      status_id: 1,
      user_ids: [],
      apply_permissions_to_users: false,
      apply_locations_to_users: false,
    };

    if (isEditMode && rolePresetData) {
      return {
        role_id: rolePresetData.role_id,
        // role_id: 0,
        location_ids: rolePresetData.location_ids,
        presets: rolePresetData.presets,
        status_id: rolePresetData.status_id,
        user_ids: rolePresetData.user_ids || [],
        apply_permissions_to_users:
          rolePresetData.apply_permissions_to_users || false,
        apply_locations_to_users:
          rolePresetData.apply_locations_to_users || false,
      };
    }

    return defaultValues;
  }, [isEditMode, rolePresetData]);
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      role_id: Yup.number()
        .required("Role is required")
        .min(1, "Please select a Role"),
      location_ids: Yup.array()
        .of(Yup.number().required())
        .min(1, "At least one location must be selected")
        .required("Locations are required"),
      presets: Yup.array()
        .of(
          Yup.object().shape({
            module_ids: Yup.number().required(),
            action_ids: Yup.array()
              .of(Yup.number().required())
              .min(1, "At least one action must be selected")
              .required(),
          })
        )
        .min(1, "At least one module-action permission must be set")
        .required("Permissions are required"),
      status_id: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
      user_ids: Yup.array().of(Yup.number().required()).default([]), // Default to empty array instead of optional
      apply_permissions_to_users: Yup.boolean().default(false),
      apply_locations_to_users: Yup.boolean().default(false),
    });
  }, []);
  const handleSubmit = async (
    values: RolePresetFormValues,
    formikHelpers: FormikHelpers<RolePresetFormValues>
  ) => {
    try {
      // Convert form values to API format
      const apiPayload: RolePresetFormValues = {
        role_id: values.role_id,
        location_ids: values.location_ids,
        presets: values.presets,
        status_id: +values.status_id as 1 | 2,
        user_ids: values.user_ids || [],
        apply_permissions_to_users: values.apply_permissions_to_users || false,
        apply_locations_to_users: values.apply_locations_to_users || false,
      };

      if (isEditMode && rolePresetId) {
        console.log(
          "Submitting updated Role Preset:",
          apiPayload,
          "ID:",
          values.role_id
        );
        await updateRolePreset({ put }, values.role_id, apiPayload);
      } else {
        console.log("Submitting new Role Preset:", apiPayload);
        await createRolePreset({ post }, apiPayload);
      }
      formikHelpers.resetForm();
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save role preset");
      console.error("Error saving role preset:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/role-presets");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="role-presets"
      isEditMode={isEditMode}
      loadingText="Role Preset Form"
    >
      <MultiStepForm<RolePresetFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingRolePresetData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/role-presets"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Role Presets List"
      />
    </PermissionGuard>
  );
};

export default RolePresetForm;
