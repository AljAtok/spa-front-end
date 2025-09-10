import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/warehouse-hurdles";

interface ApiMethods {
  get: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

export interface StoreHurdleApiResponse {
  id?: number;
  warehouse_id?: number;
  warehouse_ids?: number[];
  item_category_id?: number;
  item_category_ids?: number[];
  ss_hurdle_qty: number;
  hurdle_date: string;
  status_id: 1 | 2;
  location_filter?: number | null;
  extension_categories?: {
    id: number;
    warehouse_id: number;
    item_category_id: number;
    item_category_name: string;
    status_id: number;
  }[];
  // ...other possible fields
}

export const fetchStoreHurdleById = async (
  { get }: Pick<ApiMethods, "get">,
  id: number | string
): Promise<StoreHurdleApiResponse> => {
  const response = await get<{ data: StoreHurdleApiResponse }>(
    `${API_END_POINT}/${id}`
  );
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response as StoreHurdleApiResponse;
};
