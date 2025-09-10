import { Employee } from "@/types/EmployeeTypes";
import { AxiosRequestConfig } from "axios";

const API_BASE = "/employees";

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

export const fetchEmployees = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<{ data: Employee[] }>(API_BASE);
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

export const fetchEmployeeById = async (
  { get }: Pick<ApiMethods, "get">,
  id: number | string
): Promise<Employee> => {
  const response = await get<{ data: Employee }>(`${API_BASE}/${id}`);
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response as Employee;
};

export const toggleEmployeeStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: 1 | 2,
  employeeName: string
) => {
  return patch(`/employees/${id}/toggle-status-activate`, {
    status_id: newStatusId,
    employee_name: employeeName,
  });
};

export const toggleEmployeeStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string | number,
  newStatusId: 1 | 2,
  employeeName: string
) => {
  return patch(`/employees/${id}/toggle-status-deactivate`, {
    status_id: newStatusId,
    employee_name: employeeName,
  });
};
