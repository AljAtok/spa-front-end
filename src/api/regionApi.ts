// src/api/regionApi.ts
// import api from "./axiosConfig";
import { Region } from "@/types/RegionTypes";
import { AxiosRequestConfig } from "axios";

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

const API_END_POINT = "/regions";

export const fetchAllRegions = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Region[] }>(API_END_POINT);
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

export const fetchRegionById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Region | null> => {
  try {
    return await get<Region>(`${API_END_POINT}/${id}`);
  } catch (error) {
    console.error(`Error fetching region ${id}:`, error);
    return null;
  }
};

export const toggleRegionStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  regionName: string
): Promise<Region> => {
  const response = await patch<Region>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    { status_id: newStatusId, region_name: regionName },
    "Operation ended successfully"
  );
  return response;
};

export const toggleRegionStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  regionName: string
): Promise<Region> => {
  const response = await patch<Region>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    { status_id: newStatusId, region_name: regionName },
    "Operation ended successfully"
  );
  return response;
};
