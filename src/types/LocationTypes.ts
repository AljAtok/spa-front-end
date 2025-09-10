export interface LocationType {
  id: number;
  location_type_name: string;
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

export interface Location {
  id: number;
  location_name: string;
  location_type_id: number;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  location_code: string;
  location_abbr: string;
  location_type_name: string;
  region_name: string;
  created_user: string;
  updated_user: string | null;
  status_name: string;
  [key: string]: unknown; // Add index signature for DataGrid
}

// Form value types for consistent status handling
export interface LocationTypeFormValues {
  location_type_name: string;
  status: 1 | 2; // 1 for Active, 2 for Inactive
}

export interface LocationFormValues {
  location_name: string;
  location_code: string; // New field
  location_abbr: string; // New field
  location_type_id: number;
  status: 1 | 2; // 1 for Active, 2 for Inactive
  region_id: number; // Add region_id for region selection
}
