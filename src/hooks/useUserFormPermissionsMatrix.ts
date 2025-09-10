import { useState, useEffect, useMemo, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import { fetchAllModules } from "@/api/moduleApi";
import { fetchAllActions } from "@/api/actionApi";
import { fetchNestedRolePreset } from "@/api/userApi";
import { Module } from "@/types/ModuleTypes";
import { Action } from "@/types/ActionTypes";
import {
  NestedRolePresetResponse,
  NestedRolePresetModule,
  NestedRolePresetAction,
} from "@/types/UserTypes";

export interface UserFormPermissionsMatrixProps {
  values: {
    role_id: number;
    user_permission_presets: Array<{
      module_ids: number;
      action_ids: number[];
    }>;
  };
  formikProps: {
    setFieldValue: (field: string, value: unknown) => void;
  };
  isEditMode?: boolean;
  originalRoleId?: number | null;
  originalUserPermissions?: Array<{
    module_ids: number;
    action_ids: number[];
  }> | null;
}

export interface UserFormPermissionsMatrixReturn {
  modules: Module[];
  actions: Action[];
  filteredModules: Module[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handlePermissionChange: (
    moduleId: number,
    actionId: number,
    checked: boolean
  ) => void;
  isPermissionChecked: (moduleId: number, actionId: number) => boolean;
  handleColumnToggle: (actionId: number) => void;
  handleRowToggle: (moduleId: number) => void;
  error: string | null;
  isRoleBasedView: boolean;
}

export const useUserFormPermissionsMatrix = ({
  values,
  formikProps,
  isEditMode = false,
  originalRoleId = null,
  originalUserPermissions = null,
}: UserFormPermissionsMatrixProps): UserFormPermissionsMatrixReturn => {
  const [modules, setModules] = useState<Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [roleModules, setRoleModules] = useState<Module[]>([]);
  const [rolePresetData, setRolePresetData] =
    useState<NestedRolePresetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRoleBasedView, setIsRoleBasedView] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { get } = useApi();

  // Load role-based modules and actions when role changes (only in create mode)
  useEffect(() => {
    const loadRoleBasedData = async () => {
      // In edit mode, only load role-based permissions if the role has actually changed
      if (isEditMode) {
        if (originalRoleId === null) {
          // Original role not loaded yet, skip for now
          console.log(
            "Original role not loaded yet, skipping role-based permission loading (PermissionsMatrixStep)"
          );
          return;
        }
        if (originalRoleId === values.role_id) {
          // Role hasn't changed OR role has been changed back to original, restore original user permissions
          console.log(
            "Role is back to original in edit mode, restoring original user custom permissions (PermissionsMatrixStep)"
          );

          // Restore original user permissions
          if (originalUserPermissions) {
            formikProps.setFieldValue(
              "user_permission_presets",
              originalUserPermissions
            );
            console.log(
              "🔧 Restored original user permissions (PermissionsMatrixStep):",
              originalUserPermissions
            );
          }

          setIsRoleBasedView(false);
          setRolePresetData(null);
          return;
        }

        // Role has changed, load new role-based permissions
        console.log(
          `Role changed from ${originalRoleId} to ${values.role_id}, loading new role-based permissions (PermissionsMatrixStep)`
        );
      }

      if (values.role_id && values.role_id > 0) {
        try {
          console.log(
            "Loading role-based permissions for role:",
            values.role_id
          );
          const rolePresetData = await fetchNestedRolePreset(
            { get },
            values.role_id
          );
          if (rolePresetData && rolePresetData.modules) {
            console.log("Role preset modules:", rolePresetData.modules);

            // Store the complete role preset data
            setRolePresetData(rolePresetData);

            // Convert NestedRolePresetModule to Module format for display
            const roleModulesData: Module[] = rolePresetData.modules.map(
              (module: NestedRolePresetModule) => ({
                id: module.id,
                module_name: module.module_name,
                module_alias: module.module_alias,
                module_link: module.module_link,
                menu_title: module.menu_title,
                parent_title: module.parent_title,
                link_name: module.link_name,
                status_id: module.status_id,
                created_at: module.created_at,
                modified_at: module.modified_at,
                // Fill in missing required fields with defaults
                created_by: 0,
                updated_by: 0,
                created_user: "",
                updated_user: "",
                status_name: module.status_id === 1 ? "Active" : "Inactive",
              })
            );

            setRoleModules(roleModulesData);
            setIsRoleBasedView(true);
            console.log("Role-based data loaded:", {
              modules: roleModulesData.length,
              mode: isEditMode ? "edit (role changed)" : "create",
            });
          } else {
            setIsRoleBasedView(false);
            setRolePresetData(null);
          }
        } catch (error) {
          console.error("Error loading role-based permissions:", error);
          setIsRoleBasedView(false);
          setRolePresetData(null);
        }
      } else {
        setIsRoleBasedView(false);
        setRolePresetData(null);
      }
    };
    loadRoleBasedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.role_id, get, isEditMode, originalRoleId]); // Intentionally exclude formikProps and originalUserPermissions to prevent loops

  // Load all modules and actions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all modules
        const modulesResponse = await fetchAllModules({ get });
        const activeModules = modulesResponse.filter(
          (module: Module) => module.status_id === 1
        );
        setModules(activeModules);

        // Load all actions
        const actionsResponse = await fetchAllActions({ get });
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

  // Determine which modules to display
  const displayModules = isRoleBasedView ? roleModules : modules;
  const displayActions = actions; // Always use all actions for the header

  // Filter displayed modules based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) {
      return displayModules;
    }
    return displayModules.filter((module) =>
      module.module_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [displayModules, searchQuery]);

  const handlePermissionChange = useCallback(
    (moduleId: number, actionId: number, checked: boolean) => {
      const currentPresets = values.user_permission_presets || [];
      const existingPresetIndex = currentPresets.findIndex(
        (preset) => preset.module_ids === moduleId
      );

      if (existingPresetIndex >= 0) {
        // Module preset exists, update action_ids
        const existingPreset = currentPresets[existingPresetIndex];
        let updatedActionIds = [...existingPreset.action_ids];

        if (checked) {
          // Add action if not already present
          if (!updatedActionIds.includes(actionId)) {
            updatedActionIds.push(actionId);
          }
        } else {
          // Remove action
          updatedActionIds = updatedActionIds.filter((id) => id !== actionId);
        }

        const updatedPresets = [...currentPresets];
        if (updatedActionIds.length > 0) {
          updatedPresets[existingPresetIndex] = {
            module_ids: moduleId,
            action_ids: updatedActionIds,
          };
        } else {
          // Remove preset if no actions remain
          updatedPresets.splice(existingPresetIndex, 1);
        }

        formikProps.setFieldValue("user_permission_presets", updatedPresets);
      } else if (checked) {
        // Create new preset for this module
        const newPreset = {
          module_ids: moduleId,
          action_ids: [actionId],
        };
        formikProps.setFieldValue("user_permission_presets", [
          ...currentPresets,
          newPreset,
        ]);
      }
    },
    [values.user_permission_presets, formikProps]
  );

  const isPermissionChecked = useCallback(
    (moduleId: number, actionId: number) => {
      // Debug logging for permissions matrix in edit mode
      if (isEditMode) {
        console.log(
          `🔍 Checking permission for Module ${moduleId}, Action ${actionId}:`,
          {
            isEditMode,
            isRoleBasedView,
            userPermissionPresets: values.user_permission_presets,
            rolePresetData: rolePresetData ? "present" : "null",
          }
        );
      }

      // Check role-based defaults first if available
      if (isRoleBasedView && rolePresetData) {
        // Find the module in the role preset data
        const roleModule = rolePresetData.modules.find(
          (m: NestedRolePresetModule) => m.id === moduleId
        );
        if (roleModule && roleModule.actions) {
          // Check if this action is in the role's default actions for this module
          const hasDefaultAction = roleModule.actions.some(
            (action: NestedRolePresetAction) => action.id === actionId
          );

          if (hasDefaultAction) {
            // This is a default permission from the role
            const modulePreset = values.user_permission_presets?.find(
              (preset) => preset.module_ids === moduleId
            );

            // If user has custom permissions for this module, use them
            if (modulePreset) {
              const result = modulePreset.action_ids.includes(actionId);
              console.log(`🔧 Role-based with custom override: ${result}`);
              return result;
            }

            // Otherwise, return true as it's a default role permission
            console.log(`🔧 Role-based default: true`);
            return true;
          }
        }
      }

      // For non-role-based modules or actions not in role defaults
      const modulePreset = values.user_permission_presets?.find(
        (preset) => preset.module_ids === moduleId
      );
      const result = modulePreset
        ? modulePreset.action_ids.includes(actionId)
        : false;

      if (isEditMode) {
        console.log(`🔧 User permissions check: ${result}`, {
          modulePreset,
          hasAction: modulePreset
            ? modulePreset.action_ids.includes(actionId)
            : false,
        });
      }
      return result;
    },
    [
      values.user_permission_presets,
      isRoleBasedView,
      rolePresetData,
      isEditMode,
    ]
  );

  const handleColumnToggle = useCallback(
    (actionId: number) => {
      const allChecked = filteredModules.every((module) =>
        isPermissionChecked(module.id, actionId)
      );

      const currentPresets = values.user_permission_presets || [];

      // Create a map for faster lookups and updates
      const presetsMap = new Map(
        currentPresets.map((preset) => [preset.module_ids, preset])
      );

      // Process filtered modules and build new presets array
      const newPresets = filteredModules.reduce((acc, module) => {
        const existingPreset = presetsMap.get(module.id);
        const currentActionIds = existingPreset
          ? [...existingPreset.action_ids]
          : [];

        let updatedActionIds;
        if (!allChecked) {
          // Add action if not present
          updatedActionIds = currentActionIds.includes(actionId)
            ? currentActionIds
            : [...currentActionIds, actionId];
        } else {
          // Remove action
          updatedActionIds = currentActionIds.filter((id) => id !== actionId);
        }

        // Only include preset if it has actions
        if (updatedActionIds.length > 0) {
          acc.push({
            module_ids: module.id,
            action_ids: updatedActionIds,
          });
        }

        return acc;
      }, [] as typeof currentPresets);

      // Add any remaining presets for modules not in the current filtered modules list
      currentPresets.forEach((preset) => {
        if (
          !filteredModules.some((module) => module.id === preset.module_ids)
        ) {
          newPresets.push(preset);
        }
      });

      formikProps.setFieldValue("user_permission_presets", newPresets);
    },
    [
      filteredModules,
      isPermissionChecked,
      values.user_permission_presets,
      formikProps,
    ]
  );

  const handleRowToggle = useCallback(
    (moduleId: number) => {
      const allChecked = displayActions.every((action) =>
        isPermissionChecked(moduleId, action.id)
      );

      const currentPresets = values.user_permission_presets || [];

      let newPresets;
      if (!allChecked) {
        // Select all actions for this module
        const allActionIds = displayActions.map((action) => action.id);
        newPresets = currentPresets.filter(
          (preset) => preset.module_ids !== moduleId
        );
        newPresets.push({
          module_ids: moduleId,
          action_ids: allActionIds,
        });
      } else {
        // Deselect all actions for this module
        newPresets = currentPresets.filter(
          (preset) => preset.module_ids !== moduleId
        );
      }

      formikProps.setFieldValue("user_permission_presets", newPresets);
    },
    [
      displayActions,
      isPermissionChecked,
      values.user_permission_presets,
      formikProps,
    ]
  );

  return {
    modules: displayModules,
    actions: displayActions,
    filteredModules,
    searchQuery,
    setSearchQuery,
    handlePermissionChange,
    isPermissionChecked,
    handleColumnToggle,
    handleRowToggle,
    error,
    isRoleBasedView,
  };
};
