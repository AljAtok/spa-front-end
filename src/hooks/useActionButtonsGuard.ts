// src/hooks/useActionButtonsGuard.ts
import { useMemo } from "react";
import { DataGridAction } from "../components/DatagridActions";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import { useUserPermissions } from "./useUserPermissions";

export interface ActionButtonsConfig<T> {
  moduleAlias: string;
  editHandler: (id: string | number, rowData: T) => void;
  toggleStatusHandler: (id: string | number, rowData: T) => void;
  editTooltip?: string;
  activateTooltip?: string | ((rowData: T) => string);
  deactivateTooltip?: string | ((rowData: T) => string);
}

export interface ActionButtonsGuardResult<T> {
  actions: DataGridAction<T>[];
  hasEditPermission: boolean;
  hasActivatePermission: boolean;
  hasDeactivatePermission: boolean;
  hasPostPermission: boolean;
  hasCancelPermission: boolean;
  hasRevertPermission: boolean;
}

/**
 * ActionButtonsGuard Hook - A reusable hook that generates permission-protected action buttons
 * for management pages. This eliminates the repetitive permission checking logic across
 * multiple management components.
 *
 * @param config - Configuration object containing module alias, handlers, and tooltips
 * @returns Object containing actions array and permission flags
 */
export function useActionButtonsGuard<T extends { status_id: number }>(
  config: ActionButtonsConfig<T>
): ActionButtonsGuardResult<T> {
  const {
    canEditInModule,
    canActivateInModule,
    canDeactivateInModule,
    canPostInModule,
    canCancelInModule,
    canRevertInModule,
  } = useUserPermissions();

  // Get permissions for the specified module
  const hasEditPermission = canEditInModule(config.moduleAlias);
  const hasActivatePermission = canActivateInModule(config.moduleAlias);
  const hasDeactivatePermission = canDeactivateInModule(config.moduleAlias);
  const hasPostPermission = canPostInModule(config.moduleAlias);
  const hasCancelPermission = canCancelInModule(config.moduleAlias);
  const hasRevertPermission = canRevertInModule(config.moduleAlias);

  const actions = useMemo((): DataGridAction<T>[] => {
    const actionList: DataGridAction<T>[] = [];

    // Add edit action only if user has edit permission
    if (hasEditPermission) {
      actionList.push({
        type: "edit",
        onClick: config.editHandler,
        tooltip: config.editTooltip || "Edit",
        color: "success",
        icon: EditOutlinedIcon,
        ariaLabel: "edit",
      });
    }

    // Add toggle status action only if user has activate/deactivate permissions
    if (hasActivatePermission || hasDeactivatePermission) {
      actionList.push({
        type: "toggleStatus",
        onClick: config.toggleStatusHandler,
        icon: (rowData: T) =>
          rowData.status_id === 1
            ? ToggleOnOutlinedIcon
            : ToggleOffOutlinedIcon,
        tooltip: (rowData: T) => {
          if (rowData.status_id === 1) {
            // Active -> can deactivate
            return typeof config.deactivateTooltip === "function"
              ? config.deactivateTooltip(rowData)
              : config.deactivateTooltip || "Deactivate";
          } else {
            // Inactive -> can activate
            return typeof config.activateTooltip === "function"
              ? config.activateTooltip(rowData)
              : config.activateTooltip || "Activate";
          }
        },
        color: (rowData: T) =>
          rowData.status_id === 1 ? "success" : "warning",
        ariaLabel: (rowData: T) =>
          rowData.status_id === 1 ? "deactivate" : "activate",
        // Show condition based on specific permissions for each action
        showCondition: (rowData: T) => {
          if (rowData.status_id === 1) {
            return hasDeactivatePermission; // Show deactivate button only if user has deactivate permission
          } else {
            return hasActivatePermission; // Show activate button only if user has activate permission
          }
        },
      });
    }

    return actionList;
  }, [
    config,
    hasEditPermission,
    hasActivatePermission,
    hasDeactivatePermission,
  ]);

  return {
    actions,
    hasEditPermission,
    hasActivatePermission,
    hasDeactivatePermission,
    hasPostPermission,
    hasCancelPermission,
    hasRevertPermission,
  };
}
