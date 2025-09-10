import { Company, CompanyFormValues } from "../types/CompanyTypes";
import { AxiosRequestConfig } from "axios";

const API_END_POINT = "/companies";

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
}

export const fetchAllCompanies = async ({ get }: Pick<ApiMethods, "get">) => {
  const response = await get<Company[]>(API_END_POINT);
  return Array.isArray(response) ? response : [];
};

// Function to fetch a single company by ID
export const fetchCompanyById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Company | null> => {
  try {
    const response = await get<{ data: Company }>(`${API_END_POINT}/${id}`);
    if (response && typeof response === "object" && "data" in response) {
      return response.data;
    }
    return response as Company;
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error);
    return null;
  }
};

// Function to create a new company
export const createCompany = async (
  { post }: Pick<ApiMethods, "post">,
  formData: CompanyFormValues
): Promise<Company> => {
  const apiPayload = {
    company_name: formData.company_name,
    company_abbr: formData.company_abbr,
    status_id: +formData.status,
  };
  return post<Company>(
    API_END_POINT,
    apiPayload,
    "Company created successfully"
  );
};

// Function to update an existing company
export const updateCompany = async (
  { put }: Pick<ApiMethods, "put">,
  id: string,
  formData: CompanyFormValues
): Promise<Company> => {
  const apiPayload = {
    company_name: formData.company_name,
    company_abbr: formData.company_abbr,
    status_id: +formData.status,
  };
  return put<Company>(
    `${API_END_POINT}/${id}`,
    apiPayload,
    "Company updated successfully"
  );
};

export const toggleCompanyStatusActivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  companyName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-activate`,
    {
      status_id: newStatusId,
      company_name: companyName,
    }
  );
  return response;
};

export const toggleCompanyStatusDeactivate = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  newStatusId: number,
  companyName: string
) => {
  const response = await patch<{ data: unknown }>(
    `${API_END_POINT}/${id}/toggle-status-deactivate`,
    {
      status_id: newStatusId,
      company_name: companyName,
    }
  );
  return response;
};
