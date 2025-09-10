// src/api/positionApi.ts
import { AxiosRequestConfig } from "axios";
import { Position } from "@/types/PositionTypes";

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
}

const API_BASE = "/positions";

export const fetchPositions = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Position[] }>(API_BASE);
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

export const togglePositionStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string
) => {
  return patch(`${API_BASE}/${id}/toggle-status-activate`, {});
};

export const togglePositionStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string
) => {
  return patch(`${API_BASE}/${id}/toggle-status-deactivate`, {});
};

export const createPosition = async (
  { post }: Pick<ApiMethods, "post">,
  data: unknown
) => {
  return post(API_BASE, data);
};

export const updatePosition = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  data: unknown
) => {
  return put(`${API_BASE}/${id}`, data);
};
