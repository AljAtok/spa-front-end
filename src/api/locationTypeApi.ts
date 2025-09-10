import { LocationType } from "../types/LocationTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/location-types";

interface ApiMethods {
  get: <T = unknown>(
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

export const fetchAllLocationTypes = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<LocationType[]> => {
  return get<LocationType[]>(API_END_POINT);
};

// Function to fetch a single location type by ID
export const fetchLocationTypeById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<LocationType | null> => {
  try {
    return await get<LocationType>(`${API_END_POINT}/${id}`);
  } catch (error) {
    console.error(`Error fetching location type ${id}:`, error);
    return null;
  }
};

export const toggleLocationTypeStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  locationTypeName: string
): Promise<LocationType> => {
  return patch<LocationType>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      location_type_name: locationTypeName,
    },
    "Location type status updated successfully"
  );
};

export const toggleLocationTypeStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  locationTypeName: string
): Promise<LocationType> => {
  return patch<LocationType>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      location_type_name: locationTypeName,
    },
    "Location type status updated successfully"
  );
};
