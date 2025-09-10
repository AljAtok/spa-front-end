import { StoreEmployee } from "@/types/StoreEmployeeType";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/warehouse-employees";

interface ApiMethods {
  get: <T = unknown>(
    url: string,
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

export const fetchStoreEmployees = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<StoreEmployee[]> => {
  const response = await get<{ data: StoreEmployee[] }>(API_END_POINT);
  if (Array.isArray(response)) return response;
  return response.data || [];
};

export const fetchStoreEmployeeById = async (
  { get }: Pick<ApiMethods, "get">,
  id: number | string
): Promise<StoreEmployee> => {
  const response = await get<{ data: StoreEmployee }>(`${API_END_POINT}/${id}`);
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response as StoreEmployee;
};

export const toggleStoreEmployeeStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: 1 | 2
) => {
  return patch(`/warehouse-employees/${id}/toggle-status-activate`, {
    status_id: newStatusId,
  });
};

export const toggleStoreEmployeeStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: 1 | 2
) => {
  return patch(`/warehouse-employees/${id}/toggle-status-deactivate`, {
    status_id: newStatusId,
  });
};
