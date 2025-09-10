export interface RolePreset {
  id: number;
  role_id: number;
  location_ids: number[];
  presets: Array<{
    module_ids: number;
    action_ids: number[];
  }>;
  status_id: number;
  user_ids: number[]; // Added user selection
  apply_permissions_to_users: boolean; // Apply Permission Matrix to selected Users
  apply_locations_to_users: boolean; // Apply Location to selected Users
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  role_name: string;
  location_names: string[];
  status_name: string;
  created_user: string;
  updated_user: string | null;
  [key: string]: unknown; // Add index signature for DataGrid
}

// Form value types for the complex role preset form
export interface RolePresetFormValues {
  role_id: number;
  location_ids: number[];
  presets: Array<{
    module_ids: number;
    action_ids: number[];
  }>;
  status_id: 1 | 2; // 1 for Active, 2 for Inactive
  user_ids: number[]; // Multiple user selection with filter by current role
  apply_permissions_to_users: boolean; // Apply Permission Matrix to selected Users
  apply_locations_to_users: boolean; // Apply Location to selected Users
}
