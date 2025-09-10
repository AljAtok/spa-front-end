import { RolePreset, RolePresetFormValues } from "../types/RolePresetsTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/role-presets";

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
  patch: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

export const fetchAllRolePresets = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: RolePreset[] }>(API_END_POINT);
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }
  return [];
};

// Function to fetch a single role preset by ID
export const fetchRolePresetById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<RolePreset | null> => {
  try {
    const response = await get<{ data: RolePreset }>(`${API_END_POINT}/${id}`);
    if (response && typeof response === "object" && "data" in response) {
      return response.data;
    } else {
      return response;
    }
  } catch (error) {
    console.error(`Error fetching role preset ${id}:`, error);
    return null;
  }
};

// Function to create a new role preset
export const createRolePreset = async (
  { post }: Pick<ApiMethods, "post">,
  formData: RolePresetFormValues
): Promise<RolePreset> => {
  return post<RolePreset>(
    API_END_POINT,
    formData,
    "Role preset created successfully"
  );
};

// Function to update an existing role preset
export const updateRolePreset = async (
  { put }: Pick<ApiMethods, "put">,
  id: string | number,
  formData: RolePresetFormValues
): Promise<RolePreset> => {
  return put<RolePreset>(
    `${API_END_POINT}/${id}`,
    formData,
    "Role preset updated successfully"
  );
};

export const toggleRolePresetStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: number,
  newStatusId: number,
  roleName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      role_name: roleName,
    }
  );
  return response;
};

export const toggleRolePresetStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: number,
  newStatusId: number,
  roleName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      role_name: roleName,
    }
  );
  return response;
};
