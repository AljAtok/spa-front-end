// src/types/ActionTypes.ts

export interface Action {
  id: number;
  action_name: string;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  status_name: string;
  created_user: string;
  updated_user: string | null;
  [key: string]: unknown; // Add index signature for DataGrid
}

// Form value types for consistent status handling
export interface ActionFormValues {
  action_name: string;
  status: 1 | 2; // 1 for Active, 2 for Inactive
}
