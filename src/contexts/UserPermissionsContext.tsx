// src/contexts/UserPermissionsContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { NestedUserModule } from "../types/UserTypes";
import { getLoggedUserId, hasAuthCredentials } from "../utils/auth";
import { useApi } from "../hooks/useApi";
import { fetchUserNestedAccessKeyByID } from "../api/userApi";
import { Box, Typography, Button } from "@mui/material";

// Type for API errors with response property
interface ApiErrorWithResponse extends Error {
  response?: {
    status: number;
    data?: unknown;
  };
}

import {
  GroupedModules,
  SidebarModule,
  UserPermissionsContextType,
} from "../types/UserPermissionsContextType";
import { useLocation } from "react-router-dom";

const UserPermissionsContext = createContext<
  UserPermissionsContextType | undefined
>(undefined);

interface UserPermissionsProviderProps {
  children: ReactNode;
}

export const UserPermissionsProvider: React.FC<
  UserPermissionsProviderProps
> = ({ children }) => {
  const [userModules, setUserModules] = useState<NestedUserModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReloadMessage, setShowReloadMessage] = useState(false);
  // Initialize with full user data fetch
  const [fullUserData, setFullUserData] = useState<object | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const apiInstance = useApi();
  const { get } = apiInstance;
  const location = useLocation();
  const fetchUserPermissions = useCallback(async () => {
    try {
      setLoading(false);
      setError(null);
      setShowReloadMessage(false);

      // Check if user has auth credentials (more lenient than isAuthenticated)
      const hasCredentials = hasAuthCredentials();
      if (!hasCredentials) {
        console.debug(
          "🔒 UserPermissionsContext: No auth credentials, stopping permission fetch"
        );
        setError("User not authenticated");
        setLoading(false);
        return;
      } else {
        console.log("🔍 Context auth check:", {
          hasCredentials,
          currentPath: location.pathname,
          timestamp: new Date().toISOString(),
        });
      }

      const userId = getLoggedUserId();
      if (!userId) {
        console.warn(
          "User has auth credentials but no user ID found - possible token issue"
        );
        setShowReloadMessage(true);
        setLoading(false);
        return;
      }

      try {
        // Attempt to fetch real user data
        const userData = await fetchUserNestedAccessKeyByID(
          { get },
          userId.toString()
        );

        if (!userData) {
          throw new Error("No user data returned from API");
        } else {
          console.log("Real user full data loaded:", userData);
          setFullUserData(userData);
        }

        // Filter modules where user has "view" action permission
        const authorizedModules = userData.modules.filter((module) => {
          return module.actions.some(
            (action) =>
              action.action_name.toLowerCase() === "view" &&
              action.permission_status_id === 1
          );
        });

        console.log("Real user permissions loaded:", authorizedModules);
        setUserModules(authorizedModules);
        setShowReloadMessage(false);
        setRetryCount(0); // Reset retry count on success
      } catch (apiError) {
        console.error("Failed to fetch user permissions:", apiError);
        // Check if it's an authentication error (401)
        const isAuthError = (
          apiError: unknown
        ): apiError is ApiErrorWithResponse => {
          return (
            apiError instanceof Error &&
            "response" in apiError &&
            typeof (apiError as ApiErrorWithResponse).response?.status ===
              "number" &&
            (apiError as ApiErrorWithResponse).response?.status === 401
          );
        };

        if (isAuthError(apiError)) {
          console.log(
            "🔄 Authentication error during permission fetch - token refresh may be in progress"
          );

          // Check retry count to prevent infinite loops
          if (retryCount < maxRetries) {
            console.log(
              `🔄 Retrying permission fetch (attempt ${
                retryCount + 1
              }/${maxRetries})`
            );
            setRetryCount((prev: number) => prev + 1);
            setError(null);
            setShowReloadMessage(false);
            // Retry after a delay with exponential backoff to allow token refresh to complete
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds
            setTimeout(() => {
              fetchUserPermissions();
            }, retryDelay);
          } else {
            console.warn("❌ Max retries reached for permission fetch");
            setError("Failed to load user permissions after multiple attempts");
            setShowReloadMessage(true);
            setRetryCount(0); // Reset for next attempt
          }
        } else {
          setError("Failed to load user permissions");
          setShowReloadMessage(true);
        }
      }
    } catch (err: unknown) {
      console.error("Error in fetchUserPermissions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user permissions"
      );
      setShowReloadMessage(true);
    } finally {
      setLoading(false);
    }
  }, [get, location.pathname, retryCount, maxRetries]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]); // Transform modules into sidebar format
  const authorizedModules: SidebarModule[] = userModules.map((module) => ({
    id: module.id,
    title: module.link_name, // Changed: use link_name for SidebarItem.title
    to: module.module_link,
    module_alias: module.module_alias,
    parent_title: module.parent_title,
    link_name: module.link_name,
    menu_title: module.menu_title,
    order_level: module.order_level,
  }));
  // Group modules by parent_title, then by menu_title, and sort by order_level
  const groupedModules: GroupedModules = authorizedModules.reduce(
    (groups, module) => {
      const parentTitle = module.parent_title || "Other";
      const menuTitle = module.menu_title || "Default";

      if (!groups[parentTitle]) {
        groups[parentTitle] = {};
      }

      if (!groups[parentTitle][menuTitle]) {
        groups[parentTitle][menuTitle] = [];
      }

      groups[parentTitle][menuTitle].push(module);
      return groups;
    },
    {} as GroupedModules
  );

  // Sort modules within each menu group by order_level
  Object.keys(groupedModules).forEach((parentTitle) => {
    Object.keys(groupedModules[parentTitle]).forEach((menuTitle) => {
      groupedModules[parentTitle][menuTitle].sort(
        (a, b) => a.order_level - b.order_level
      );
    });
  });

  // Create sorted arrays for overall content ordering
  const sortedParentTitles = Object.keys(groupedModules).sort((a, b) => {
    // Get minimum order_level for each parent group
    const aMinOrder = Math.min(
      ...Object.values(groupedModules[a])
        .flat()
        .map((module) => module.order_level)
    );
    const bMinOrder = Math.min(
      ...Object.values(groupedModules[b])
        .flat()
        .map((module) => module.order_level)
    );
    return aMinOrder - bMinOrder;
  });

  // Create a new ordered groupedModules object
  const orderedGroupedModules: GroupedModules = {};
  sortedParentTitles.forEach((parentTitle) => {
    // Sort menu titles within each parent by minimum order_level
    const sortedMenuTitles = Object.keys(groupedModules[parentTitle]).sort(
      (a, b) => {
        const aMinOrder = Math.min(
          ...groupedModules[parentTitle][a].map((module) => module.order_level)
        );
        const bMinOrder = Math.min(
          ...groupedModules[parentTitle][b].map((module) => module.order_level)
        );
        return aMinOrder - bMinOrder;
      }
    );

    orderedGroupedModules[parentTitle] = {};
    sortedMenuTitles.forEach((menuTitle) => {
      orderedGroupedModules[parentTitle][menuTitle] =
        groupedModules[parentTitle][menuTitle];
    });
  });

  // Permission checking functions
  const hasModulePermission = useCallback(
    (moduleAlias: string, actionName: string): boolean => {
      const module = userModules.find((m) => m.module_alias === moduleAlias);
      if (!module) return false;

      return module.actions.some(
        (action) =>
          action.action_name.toLowerCase() === actionName.toLowerCase() &&
          action.permission_status_id === 1
      );
    },
    [userModules]
  );

  const canViewModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "view");
    },
    [hasModulePermission]
  );

  const canAddToModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "add");
    },
    [hasModulePermission]
  );

  const canEditInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "edit");
    },
    [hasModulePermission]
  );

  const canActivateInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "activate");
    },
    [hasModulePermission]
  );

  const canDeactivateInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "deactivate");
    },
    [hasModulePermission]
  );

  const canPostInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "post");
    },
    [hasModulePermission]
  );

  const canCancelInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "cancel");
    },
    [hasModulePermission]
  );

  const canApproveInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "approve");
    },
    [hasModulePermission]
  );

  const canRevertInModule = useCallback(
    (moduleAlias: string): boolean => {
      return hasModulePermission(moduleAlias, "activate");
    },
    [hasModulePermission]
  );
  const value: UserPermissionsContextType = {
    userModules,
    authorizedModules,
    groupedModules: orderedGroupedModules,
    loading,
    error,
    refetchUserPermission: fetchUserPermissions,
    fullUserData,
    hasModulePermission,
    canViewModule,
    canAddToModule,
    canEditInModule,
    canActivateInModule,
    canDeactivateInModule,
    canPostInModule,
    canCancelInModule,
    canApproveInModule,
    canRevertInModule,
  };

  // Show reload message if needed
  if (showReloadMessage) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 3,
          padding: 3,
        }}
      >
        <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
          Unable to Load User Permissions
        </Typography>
        <Typography variant="body1" sx={{ textAlign: "center", mb: 3 }}>
          There was an issue loading your user permissions. Please reload the
          page to try again.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => window.location.reload()}
          sx={{ mb: 2 }}
        >
          Reload Page
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setShowReloadMessage(false);
            fetchUserPermissions();
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

// Export the context for use in the hook
export { UserPermissionsContext };
