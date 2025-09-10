import { Location } from "../types/LocationTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/locations";

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

export const fetchAllLocations = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Location[] }>(API_END_POINT);
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

// Function to fetch a single location by ID
export const fetchLocationById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Location | null> => {
  try {
    return await get<Location>(`${API_END_POINT}/${id}`);
  } catch (error) {
    console.error(`Error fetching location ${id}:`, error);
    return null;
  }
};

export const toggleLocationStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  locationName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      location_name: locationName,
    }
  );
  return response;
};

export const toggleLocationStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  locationName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      location_name: locationName,
    }
  );
  return response;
};
