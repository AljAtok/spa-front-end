export interface IncentiveTransReportData {
  detail_id: number;
  transaction_header_id: number;
  warehouse_id: number;
  warehouse_ifs: string;
  warehouse_name: string;
  budget_volume: string;
  budget_volume_monthly: string;
  sales_qty: string;
  ss_hurdle_qty: string;
  rate: string;
  details_status_id: number;
  assigned_ss_name: string | null;
  assigned_ah_name: string | null;
  assigned_bch_name: string | null;
  assigned_gbch_name: string | null;
  assigned_rh_name: string | null;
  assigned_grh_name: string | null;
  trans_number: string;
  location_name: string;
  trans_date: string;
  trans_year: number;
  status_name: string;
  region_name: string;
}

export interface IncentiveTransReportRow {
  detail_id: number;
  year: number;
  quarter: number;
  monthNo: number;
  month: string;
  region: string;
  businessCenter: string;
  storeIfs: string;
  storeName: string;
  budgetVolume: number;
  hurdleQty: number;
  actualSales: number;
  rate: number;
  difference: number;
  volumeTargetReached: string;
  incentives: number;
  assignedSs: string;
  assignedAh: string;
  assignedBchGah: string;
  assignedGbch: string;
  assignedRh: string;
  assignedGrh: string;
  transNumber: string;
  transDate: string;
  statusName: string;
}

export interface IncentiveTransReportFilters {
  location_ids?: number[];
  trans_date?: string;
  status_id?: number;
}

export interface IncentiveTransReportParams {
  location_ids?: string;
  trans_date?: string;
  status_id?: string;
}
