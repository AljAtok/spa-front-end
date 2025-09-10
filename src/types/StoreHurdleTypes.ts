export interface StoreHurdle {
  id: number;
  warehouse_id: number;
  warehouse_ifs: string;
  warehouse_name: string;
  warehouse_rate: string;
  ss_hurdle_qty: number;
  hurdle_date: string;
  status_id: number;
  status_name: string;
  created_at: string;
  created_by: number;
  updated_by: number;
  modified_at: string;
  created_user: string;
  updated_user: string;
  extension_categories: Array<{
    id: number;
    warehouse_id: number;
    item_category_id: number;
    item_category_code: string;
    item_category_name: string;
    status_id: number;
  }>;
  [key: string]: unknown; // Add index signature for DataGrid
}
