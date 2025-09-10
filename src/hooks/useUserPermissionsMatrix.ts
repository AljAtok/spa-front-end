import { useMemo } from "react";
import { Module } from "@/types/ModuleTypes";
import {
  usePermissionsMatrix,
  UsePermissionsMatrixProps,
  UsePermissionsMatrixReturn,
} from "./usePermissionsMatrix";
import {
  NestedRolePresetResponse,
  NestedRolePresetModule,
  NestedRolePresetAction,
} from "@/types/UserTypes";

export interface UseUserPermissionsMatrixProps
  extends Omit<UsePermissionsMatrixProps, "modules"> {
  modules: Module[];
  roleModules: Module[];
  isRoleBasedView: boolean;
  rolePresetData: NestedRolePresetResponse | null;
  isEditMode?: boolean;
}

export interface UseUserPermissionsMatrixReturn
  extends UsePermissionsMatrixReturn {
  displayModules: Module[];
  filteredDisplayModules: Module[];
  isPermissionChecked: (moduleId: number, actionId: number) => boolean;
}

export const useUserPermissionsMatrix = ({
  modules,
  roleModules,
  actions,
  presets,
  setFieldValue,
  fieldName,
  isRoleBasedView,
  rolePresetData,
  isEditMode = false,
}: UseUserPermissionsMatrixProps): UseUserPermissionsMatrixReturn => {
  // Determine which modules to display
  const displayModules = isRoleBasedView ? roleModules : modules;

  const baseHook = usePermissionsMatrix({
    modules: displayModules,
    actions,
    presets,
    setFieldValue,
    fieldName,
  });

  // Override the isPermissionChecked function to handle role-based logic
  const isPermissionChecked = useMemo(() => {
    return (moduleId: number, actionId: number): boolean => {
      // Debug logging for permissions matrix in edit mode
      if (isEditMode) {
        console.log(
          `🔍 Checking permission for Module ${moduleId}, Action ${actionId}:`,
          {
            isEditMode,
            isRoleBasedView,
            userPermissionPresets: presets,
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
            const modulePreset = presets?.find(
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
      const modulePreset = presets?.find(
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
    };
  }, [presets, isRoleBasedView, rolePresetData, isEditMode]);

  // Override the handleColumnToggle to use displayModules instead of filteredModules
  const handleColumnToggle = useMemo(() => {
    return (actionId: number): void => {
      const allChecked = baseHook.filteredModules.every((module) =>
        isPermissionChecked(module.id, actionId)
      );

      const currentPresets = presets || [];

      // Create a map for faster lookups and updates
      const presetsMap = new Map(
        currentPresets.map((preset) => [preset.module_ids, preset])
      );

      // Process filtered modules and build new presets array
      const newPresets = baseHook.filteredModules.reduce((acc, module) => {
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
          !baseHook.filteredModules.some(
            (module) => module.id === preset.module_ids
          )
        ) {
          newPresets.push(preset);
        }
      });

      setFieldValue(fieldName, newPresets);
    };
  }, [
    baseHook.filteredModules,
    isPermissionChecked,
    presets,
    setFieldValue,
    fieldName,
  ]);

  // Override the handleRowToggle to use actions (displayActions)
  const handleRowToggle = useMemo(() => {
    return (moduleId: number): void => {
      const allChecked = actions.every((action) =>
        isPermissionChecked(moduleId, action.id)
      );

      const currentPresets = presets || [];

      let newPresets;
      if (!allChecked) {
        // Select all actions for this module
        const allActionIds = actions.map((action) => action.id);
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

      setFieldValue(fieldName, newPresets);
    };
  }, [actions, isPermissionChecked, presets, setFieldValue, fieldName]);

  return {
    ...baseHook,
    displayModules,
    filteredDisplayModules: baseHook.filteredModules,
    isPermissionChecked,
    handleColumnToggle,
    handleRowToggle,
  };
};
