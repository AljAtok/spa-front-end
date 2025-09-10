// Company Types
export interface Company {
  id: number;
  company_name: string;
  company_abbr: string;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  created_user: string;
  updated_user: string | null;
  status_name: string;
  [key: string]: unknown; // Add index signature for DataGrid
}

export interface CompanyFormValues {
  company_name: string;
  company_abbr: string;
  status: 1 | 2;
}
