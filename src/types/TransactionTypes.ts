export interface TransactionDetail {
  details_id?: number;
  warehouse_id: number;
  warehouse_name?: string;
  budget_volume: string;
  sales_qty: string;
  ss_hurdle_qty: number;
  rate: number;
  details_status_id: number;
}

export interface TransactionHeader {
  trans_date: string;
  trans_number: string;
  location_id: number;
  location_name: string;
  status_id: number;
  status_name?: string;
  created_by: number;
  access_key_id: number;
  updated_by: number | null;
  created_user: string;
  updated_user: string | null;
  id: number;
  created_at: string;
  modified_at: string;
}

export interface Transaction {
  header: TransactionHeader;
  details: TransactionDetail[];
  // Computed properties for the grid
  trans_id: number;
  trans_number: string;
  location_name: string;
  trans_date: string;
  status_name: string;
  status_id: number;
  entries: number;
  total_sales: number;
  created_at: string;
  created_user: string;
  [key: string]: unknown;
}

export interface TransactionFormValues {
  location_ids: number[];
  trans_date: string;
}

export interface TransactionEditFormValues {
  location_id: number;
  location_name: string;
  trans_date: string;
  details: TransactionDetail[];
}

export interface CreateTransactionResponse {
  location_id: number;
  location_name: string;
  status: "created" | "skipped";
  header_id?: number;
  details_count?: number;
  reason?: string;
}

export interface TransactionDetailResponse {
  header: TransactionHeader;
  details: TransactionDetail[];
}

export interface BatchUpdateHeaderRequest {
  transaction_header_id: number;
  trans_date: string;
}

export interface BatchUpdateDetailRequest {
  transaction_header_id: number;
  rate?: number;
  ss_hurdle_qty?: number;
}

export interface BatchUpdateRequest {
  header_updates?: BatchUpdateHeaderRequest[];
  detail_updates?: BatchUpdateDetailRequest[];
}

export interface BatchUpdateHeaderResponse {
  transaction_header_id: number;
  trans_date: string;
  status: string;
}

export interface BatchUpdateDetailResponse {
  transaction_header_id: number;
  rate?: number;
  ss_hurdle_qty?: number;
}

export interface BatchUpdateResponse {
  header_updates?: BatchUpdateHeaderResponse[];
  detail_updates?: BatchUpdateDetailResponse[];
}
