// src/hooks/useUserPermissions.ts
import { useContext } from "react";
import { UserPermissionsContextType } from "../types/UserPermissionsContextType";

// Import the context directly
import { UserPermissionsContext } from "../contexts/UserPermissionsContext";

export const useUserPermissions = (): UserPermissionsContextType => {
  const context = useContext(UserPermissionsContext);
  if (context === undefined) {
    throw new Error(
      "useUserPermissions must be used within a UserPermissionsProvider"
    );
  }
  return context;
};
