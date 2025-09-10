// src/api/takeOutStoreApi.ts
import { AxiosRequestConfig } from "axios";
import { TakeOutStore } from "@/types/TakeOutStoreTypes";

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

const API_BASE = "/warehouses";

export const fetchTakeOutStores = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: TakeOutStore[] }>(`${API_BASE}/stores/1`);
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  } else {
    return response;
  }
};

export const toggleTakeOutStoreStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string
) => {
  return patch(`${API_BASE}/${id}/toggle-status-activate`, {});
};

export const toggleTakeOutStoreStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string
) => {
  return patch(`${API_BASE}/${id}/toggle-status-deactivate`, {});
};
