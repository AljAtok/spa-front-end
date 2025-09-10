// src/components/PermissionGuard.tsx
import React from "react";
import { useUserPermissions } from "../hooks/useUserPermissions";
import PageLoader from "./PageLoader";
import NotAuthorized from "../pages/NotAuthorized/NotAuthorized";

interface PermissionGuardProps {
  children: React.ReactNode;
  moduleAlias: string;
  isEditMode: boolean;
  loadingText?: string;
}

/**
 * PermissionGuard - A reusable component that handles permission checking and loading states
 * for form components. This eliminates the repetitive permission checking logic.
 *
 * @param children - The component to render if permissions are valid
 * @param moduleAlias - The module alias to check permissions for (e.g., "users", "modules", "locations")
 * @param isEditMode - Whether the form is in edit mode (true) or create mode (false)
 * @param loadingText - Optional custom loading text (defaults to "{moduleAlias} Form")
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  moduleAlias,
  isEditMode,
  loadingText,
}) => {
  const {
    canEditInModule,
    canAddToModule,
    loading: permissionsLoading,
  } = useUserPermissions();

  // Check permissions based on mode
  const hasEditPermission = canEditInModule(moduleAlias);
  const hasAddPermission = canAddToModule(moduleAlias);

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    const moduleName =
      loadingText ||
      `${moduleAlias.charAt(0).toUpperCase() + moduleAlias.slice(1)} Form`;
    return <PageLoader modulename={moduleName} />;
  }

  // Check permissions and show unauthorized if user doesn't have required permission
  if (
    (isEditMode && !hasEditPermission) ||
    (!isEditMode && !hasAddPermission)
  ) {
    return <NotAuthorized />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default PermissionGuard;
