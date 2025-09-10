export interface SalesBudgetTransaction {
  location_id: number;
  location_name: string;
  sales_date: string;
  month: string;
  num_stores: number;
  budget_volume: number;
  status_name: string;
  // Add id property for DataGrid
  id: string | number;
  // Add index signature for DataGrid compatibility
  [key: string]: unknown;
}

export interface BudgetStoreDetail {
  store_ifs: string;
  store_name: string;
  month: string;
  num_items: number;
  item_categories: string[];
  budget_volume: number;
  // Add id property for DataGrid
  id: string;
  // Add index signature for DataGrid compatibility
  [key: string]: unknown;
}
