import { useState, useMemo, useCallback } from "react";
import { Module } from "@/types/ModuleTypes";
import { Action } from "@/types/ActionTypes";

export interface PermissionPreset {
  module_ids: number;
  action_ids: number[];
}

export interface UsePermissionsMatrixProps {
  modules: Module[];
  actions: Action[];
  presets: PermissionPreset[];
  setFieldValue: (field: string, value: unknown) => void;
  fieldName: string;
}

export interface UsePermissionsMatrixReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredModules: Module[];
  handlePermissionChange: (
    moduleId: number,
    actionId: number,
    checked: boolean
  ) => void;
  isPermissionChecked: (moduleId: number, actionId: number) => boolean;
  handleColumnToggle: (actionId: number) => void;
  handleRowToggle: (moduleId: number) => void;
}

export const usePermissionsMatrix = ({
  modules,
  actions,
  presets,
  setFieldValue,
  fieldName,
}: UsePermissionsMatrixProps): UsePermissionsMatrixReturn => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter modules based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) {
      return modules;
    }
    return modules.filter((module) =>
      module.module_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modules, searchQuery]);

  const handlePermissionChange = useCallback(
    (moduleId: number, actionId: number, checked: boolean) => {
      const currentPresets = presets || [];
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

        setFieldValue(fieldName, updatedPresets);
      } else if (checked) {
        // Create new preset for this module
        const newPreset = {
          module_ids: moduleId,
          action_ids: [actionId],
        };
        setFieldValue(fieldName, [...currentPresets, newPreset]);
      }
    },
    [presets, setFieldValue, fieldName]
  );

  const isPermissionChecked = useCallback(
    (moduleId: number, actionId: number) => {
      const modulePreset = presets?.find(
        (preset) => preset.module_ids === moduleId
      );
      return modulePreset ? modulePreset.action_ids.includes(actionId) : false;
    },
    [presets]
  );

  const handleColumnToggle = useCallback(
    (actionId: number) => {
      const allChecked = filteredModules.every((module) =>
        isPermissionChecked(module.id, actionId)
      );

      const currentPresets = presets || [];

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
      }, [] as PermissionPreset[]);

      // Add any remaining presets for modules not in the current filtered modules list
      currentPresets.forEach((preset) => {
        if (
          !filteredModules.some((module) => module.id === preset.module_ids)
        ) {
          newPresets.push(preset);
        }
      });

      setFieldValue(fieldName, newPresets);
    },
    [filteredModules, isPermissionChecked, presets, setFieldValue, fieldName]
  );

  const handleRowToggle = useCallback(
    (moduleId: number) => {
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
    },
    [actions, isPermissionChecked, presets, setFieldValue, fieldName]
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredModules,
    handlePermissionChange,
    isPermissionChecked,
    handleColumnToggle,
    handleRowToggle,
  };
};
