// src/types/TakeOutStoreTypes.ts
export interface TakeOutStore {
  id: number;
  warehouse_name: string;
  warehouse_ifs: string;
  warehouse_code: string;
  warehouse_type_id: number;
  location_id: number;
  segment_id: number;
  address: string;
  status_id: number;
  created_at: string;
  created_by: number | null;
  updated_by: number | null;
  modified_at: string;
  warehouse_type_name: string;
  location_name: string;
  segment_name: string;
  status_name: string;
  created_user: string | null;
  updated_user: string | null;
  [key: string]: unknown;
}
