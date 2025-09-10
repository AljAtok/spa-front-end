export interface StoreHurdleFormValues {
  location_filter: number | null;
  warehouse_ids: number[];
  item_category_ids: number[];
  ss_hurdle_qty: number;
  hurdle_date: string;
  status_id: 1 | 2 | 3 | 6; // 1: Active, 2: Inactive, 3: Pending
}

export interface StoreHurdleLocation {
  id: number;
  location_name: string;
  status_id: number;
}

export interface StoreHurdleWarehouse {
  id: number;
  warehouse_name: string;
  location_id: number;
  status_id: number;
}

export interface StoreHurdleItemCategory {
  id: number;
  name: string;
  status_id: number;
}
