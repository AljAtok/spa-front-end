// src/types/RegionTypes.ts
export interface Region {
  id: number;
  region_name: string;
  region_abbr?: string;
  status_id: number;
  status_name?: string;
  created_user?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface RegionFormValues {
  region_name: string;
  region_abbr: string;
  status: 1 | 2; // 1 for Active, 2 for Inactive
}
