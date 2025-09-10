// src/api/roleApi.ts

import { Role } from "../types/RoleTypes"; // Ensure RoleFormValues is imported
import { AxiosRequestConfig } from "axios"; // Import AxiosRequestConfig

const ROLES_API_BASE_URL = "/roles"; // Define base URL or import it from config

interface RolePayload {
  // Define the payload types for create/update
  role_name: string;
  role_level: number;
  status_id?: number;
  status_name?: string;
}

interface ApiMethods {
  get: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  post: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  put: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  del: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  patch: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

// Interface for role action preset response
export interface RoleActionPreset {
  id: number;
  role_id: number;
  module_id: number;
  action_id: number;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number;
  modified_at: string;
  role_name: string;
  module_name: string[];
  action_name: string[];
  location_name: string[];
  status_name: string;
  created_user: string;
  updated_user: string;
}

// Function to fetch all roles
export const fetchAllRoles = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<Role[]> => {
  return get<Role[]>(ROLES_API_BASE_URL);
};

// Function to fetch a single role by ID
export const fetchRoleById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Role | null> => {
  try {
    return await get<Role>(`${ROLES_API_BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    return null;
  }
};

// Create a new role
export const createRole = async (
  { post }: Pick<ApiMethods, "post">,
  roleData: RolePayload
): Promise<Role> => {
  return post<Role, RolePayload>(
    ROLES_API_BASE_URL,
    roleData,
    "Role created successfully"
  );
};

// Update an existing role
export const updateRole = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  roleData: RolePayload
): Promise<Role> => {
  return put<Role, RolePayload>(
    `${ROLES_API_BASE_URL}/${id}`,
    roleData,
    "Role updated successfully"
  );
};

// Delete a role
export const deleteRole = async (
  { del }: Pick<ApiMethods, "del">,
  id: string | number
): Promise<void> => {
  return del(`${ROLES_API_BASE_URL}/${id}`, "Role deleted successfully");
};

// Deactivate/Activate role
export const toggleRoleStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: number,
  newStatusId: 1 | 2,
  roleName: string
): Promise<Role> => {
  const actionText = newStatusId === 1 ? "activated" : "deactivated";
  return patch<Role, { status_id: 1 | 2 }>(
    `${ROLES_API_BASE_URL}/${id}/toggle-status-activate`,
    { status_id: newStatusId },
    `Role '${roleName}' ${actionText} successfully!`
  );
};

export const toggleRoleStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: number,
  newStatusId: 1 | 2,
  roleName: string
): Promise<Role> => {
  const actionText = newStatusId === 1 ? "activated" : "deactivated";
  return patch<Role, { status_id: 1 | 2 }>(
    `${ROLES_API_BASE_URL}/${id}/toggle-status-deactivate`,
    { status_id: newStatusId },
    `Role '${roleName}' ${actionText} successfully!`
  );
};

// Function to fetch role action presets
export const fetchRoleActionPresets = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<RoleActionPreset[]> => {
  return get<RoleActionPreset[]>("/role-action-presets");
};

export const fetchAllRoleNotInPresets = async ({
  get,
}: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Role[] }>(
    "/role-action-presets/roles-not-in-presets"
  );
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  } else {
    return response as unknown as Role[];
    // return response;
  }
};
