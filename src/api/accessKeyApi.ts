import { AccessKey, AccessKeyFormValues } from "../types/AccessKeyTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/access-keys";

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
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

export const fetchAllAccessKeys = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<AccessKey[]>(API_END_POINT);
  return Array.isArray(response) ? response : [];
};

// Function to fetch a single access key by ID
export const fetchAccessKeyById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<AccessKey | null> => {
  try {
    const response = await get<{ data: AccessKey }>(`${API_END_POINT}/${id}`);
    if (response && typeof response === "object" && "data" in response) {
      return response.data;
    }
    return response as AccessKey;
  } catch (error) {
    console.error(`Error fetching access key ${id}:`, error);
    return null;
  }
};

// Function to create a new access key
export const createAccessKey = async (
  { post }: Pick<ApiMethods, "post">,
  formData: AccessKeyFormValues
): Promise<AccessKey> => {
  const apiPayload = {
    access_key_name: formData.access_key_name,
    access_key_abbr: formData.access_key_abbr,
    company_id: formData.company_id,
    status_id: +formData.status,
  };
  return post<AccessKey>(
    API_END_POINT,
    apiPayload,
    "Access key created successfully"
  );
};

// Function to update an existing access key
export const updateAccessKey = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  formData: AccessKeyFormValues
): Promise<AccessKey> => {
  const apiPayload = {
    access_key_name: formData.access_key_name,
    access_key_abbr: formData.access_key_abbr,
    company_id: formData.company_id,
    status_id: +formData.status,
  };
  return put<AccessKey>(
    `${API_END_POINT}/${id}`,
    apiPayload,
    "Access key updated successfully"
  );
};

export const toggleAccessKeyStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  accessKeyName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      access_key_name: accessKeyName,
    }
  );
  return response;
};

export const toggleAccessKeyStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  accessKeyName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      access_key_name: accessKeyName,
    }
  );
  return response;
};
