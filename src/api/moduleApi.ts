// src/api/moduleApi.ts

import { Module } from "../types/ModuleTypes";
import { AxiosRequestConfig } from "axios";

const MODULES_API_BASE_URL = "/modules";

interface ModulePayload {
  module_name: string;
  module_alias: string;
  module_link: string;
  menu_title: string;
  parent_title: string;
  link_name: string;
  status_id?: number;
}

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
  del: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

// Function to fetch all modules
export const fetchAllModules = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<Module[]> => {
  return get<Module[]>(MODULES_API_BASE_URL);
};

// Function to fetch a single module by ID
export const fetchModuleById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Module | null> => {
  try {
    return await get<Module>(`${MODULES_API_BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error fetching module ${id}:`, error);
    return null;
  }
};

// Create a new module
export const createModule = async (
  { post }: Pick<ApiMethods, "post">,
  moduleData: ModulePayload
): Promise<Module> => {
  return post<Module, ModulePayload>(
    MODULES_API_BASE_URL,
    moduleData,
    "Module created successfully"
  );
};

// Update an existing module
export const updateModule = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  moduleData: ModulePayload
): Promise<Module> => {
  return put<Module, ModulePayload>(
    `${MODULES_API_BASE_URL}/${id}`,
    moduleData,
    "Module updated successfully"
  );
};

// Delete a module
export const deleteModule = async (
  { del }: Pick<ApiMethods, "del">,
  id: string | number
): Promise<void> => {
  return del(`${MODULES_API_BASE_URL}/${id}`, "Module deleted successfully");
};

// Deactivate/Activate module
export const toggleModuleStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: 1 | 2,
  moduleName: string
): Promise<Module> => {
  const actionText = newStatusId === 1 ? "activated" : "deactivated";
  return patch<Module, { status_id: 1 | 2 }>(
    `${MODULES_API_BASE_URL}/${id}/toggle-status-activate`,
    { status_id: newStatusId },
    `Module '${moduleName}' ${actionText} successfully!`
  );
};

export const toggleModuleStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: 1 | 2,
  moduleName: string
): Promise<Module> => {
  const actionText = newStatusId === 1 ? "activated" : "deactivated";
  return patch<Module, { status_id: 1 | 2 }>(
    `${MODULES_API_BASE_URL}/${id}/toggle-status-deactivate`,
    { status_id: newStatusId },
    `Module '${moduleName}' ${actionText} successfully!`
  );
};
