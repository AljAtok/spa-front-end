// Access Key Types
export interface AccessKey {
  id: number;
  access_key_name: string;
  access_key_abbr: string;
  company_id: number;
  company_name: string;
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

export interface AccessKeyFormValues {
  access_key_name: string;
  access_key_abbr: string;
  company_id: number;
  status: 1 | 2;
}
