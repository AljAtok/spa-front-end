export interface StoreEmployee {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  assigned_ss: number | null;
  assigned_ss_name: string | null;
  assigned_ah: number | null;
  assigned_ah_name: string | null;
  assigned_bch: number | null;
  assigned_bch_name: string | null;
  assigned_gbch: number | null;
  assigned_gbch_name: string | null;
  assigned_rh: number | null;
  assigned_rh_name: string | null;
  assigned_grh: number | null;
  assigned_grh_name: string | null;
  status_id: 1 | 2;
  status_name: string;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  created_user: string;
  updated_user: string | null;
  [key: string]: unknown; // Add index signature for DataGrid
}

export interface StoreEmployeeFormValues {
  warehouse_id: number | "";
  assigned_ss: number | null;
  assigned_ah: number | null;
  assigned_bch: number | null;
  assigned_gbch: number | null;
  assigned_rh: number | null;
  assigned_grh: number | null;
  status_id: 1 | 2;
}
