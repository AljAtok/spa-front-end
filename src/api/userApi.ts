import {
  User,
  UserFormValues,
  NestedRolePresetResponse,
  NestedUserResponse,
  UserInfo,
  UserAccessKeyData,
} from "../types/UserTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/users";

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

export const fetchAllUsers = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<User[]>(API_END_POINT);
  return Array.isArray(response) ? response : [];
};

export const fetchAllUsersByRole = async (
  { get }: Pick<ApiMethods, "get">,
  roleId: number
) => {
  const response = await get<UserInfo[]>(`${API_END_POINT}/info/${roleId}`);
  return Array.isArray(response) ? response : [];
};

// Function to fetch a single user by ID
export const fetchUserById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<User | null> => {
  try {
    const response = await get<{ data: User }>(`${API_END_POINT}/${id}`);
    if (response && typeof response === "object" && "data" in response) {
      return response.data;
    }
    return response as User;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return null;
  }
};

// Function to create a new user
export const createUser = async (
  { post }: Pick<ApiMethods, "post">,
  formData: UserFormValues
): Promise<User> => {
  return post<User>(API_END_POINT, formData);
};

// Function to update an existing user
export const updateUser = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  formData: UserFormValues
): Promise<User> => {
  return put<User>(
    `${API_END_POINT}/${id}`,
    formData,
    "User updated successfully"
  );
};

export const toggleUserStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: number,
  userName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      user_name: userName,
    }
  );
  return response;
};

export const toggleUserStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: number,
  userName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      user_name: userName,
    }
  );
  return response;
};

// Function to fetch nested role presets for role-based permissions
export const fetchNestedRolePreset = async (
  { get }: Pick<ApiMethods, "get">,
  roleId: number
): Promise<NestedRolePresetResponse | null> => {
  try {
    const response = await get<NestedRolePresetResponse>(
      `/role-presets/nested/${roleId}`
    );
    return response;
  } catch (error) {
    console.error(
      `Error fetching nested role preset for role ${roleId}:`,
      error
    );
    return null;
  }
};

// Function to fetch nested user data with permissions for edit mode
export const fetchUserNestedById = async (
  { get }: Pick<ApiMethods, "get">,
  userId: string
): Promise<NestedUserResponse | null> => {
  try {
    const response = await get<NestedUserResponse>(
      `${API_END_POINT}/nested/${userId}`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching nested user data for user ${userId}:`, error);
    return null;
  }
};

// Function to fetch nested user data with permissions per access key
export const fetchUserNestedAccessKeyByID = async (
  { get }: Pick<ApiMethods, "get">,
  userId: string
): Promise<NestedUserResponse | null> => {
  try {
    const response = await get<NestedUserResponse>(
      `${API_END_POINT}/nested-per-access-key/${userId}`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching nested user data for user ${userId}:`, error);
    return null;
  }
};

export const fetchPerUserAccessKey = async (
  { get }: Pick<ApiMethods, "get">,
  userId: string
): Promise<UserAccessKeyData | null> => {
  try {
    const response = await get<UserAccessKeyData>(
      `${API_END_POINT}/${userId}/available-access-keys`
    );
    return response;
  } catch (error) {
    console.error(
      `Error fetching available access keys for user ${userId}:`,
      error
    );
    return null;
  }
};
