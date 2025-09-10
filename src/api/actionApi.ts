// src/api/actionApi.ts

import { Action } from "../types/ActionTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/actions";

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

export const fetchAllActions = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Action[] }>(API_END_POINT);
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

// Function to fetch a single action by ID
export const fetchActionById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Action | null> => {
  try {
    return await get<Action>(`${API_END_POINT}/${id}`);
  } catch (error) {
    console.error(`Error fetching action ${id}:`, error);
    return null;
  }
};

export const toggleActionStatus = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  actionName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status`,
    {
      status_id: newStatusId,
      action_name: actionName,
    }
  );
  return response;
};
