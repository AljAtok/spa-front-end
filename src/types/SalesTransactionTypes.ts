export interface SalesTransaction {
  location_id: number;
  location_name: string;
  month: string;
  sales_date: string;
  num_stores: number;
  gross_sales: number;
  net_sales: number;
  total_sales_qty: number;
  status_name: string;
  // Add id property for DataGrid
  id: string | number;
  // Add index signature for DataGrid compatibility
  [key: string]: unknown;
}

export interface StoreDetail {
  store_ifs: string;
  store_name: string;
  month: string;
  num_items: number;
  item_categories: string[];
  gross_sales: number;
  net_sales: number;
  total_sales_qty: number;
  total_base_sales_qty: number;
  // Add id property for DataGrid
  id: string;
  // Add index signature for DataGrid compatibility
  [key: string]: unknown;
}
