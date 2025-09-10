// src/types/RoleTypes.ts

// No more BasicEntity, RoleStatus, CreatedByUser interfaces needed here
// as their properties are now flattened directly into the Role object.

// REDEFINED: Role interface to reflect the truly flattened structure
export interface Role {
  id: number; // Primary ID for the role
  role_name: string;
  role_level: number;
  status_id: number; // The ID of the status
  created_at: string; // ISO 8601 string
  created_by: number; // The ID of the creator
  updated_by: number | null; // The ID of the updater, can be null
  modified_at: string; // ISO 8601 string
  created_user: string; // The full name/string representation of the creator
  updated_user: string | null; // The full name/string representation of the updater, can be null
  status_name: string; // The name of the status
  [key: string]: unknown;
}

// NEW/SIMPLIFIED: Type for the raw API response before any processing
// This is very similar to Role, but all properties are optional/nullable as they arrive
export interface RawRoleApiResponse {
  id?: number | string | null;
  role_name?: string | null;
  role_level?: number | null;
  status_id?: number | null;
  created_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  modified_at?: string | null;
  created_user?: string | null;
  updated_user?: string | null;
  status_name?: string | null;
  [key: string]: unknown; // Allow any other unexpected properties
}

// Define the shape of the values for Role form
export interface RoleFormValues {
  role_name: string;
  role_level: number;
  status: 1 | 2;
}

// Interface for role action preset response
export interface RoleActionPreset {
  id: number;
  role_id: number;
  module_id: number;
  action_id: number;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number;
  modified_at: string;
  role_name: string;
  role_level?: number;
  module_name: string[];
  action_name: string[];
  location_name: string[];
  status_name: string;
  created_user: string;
  updated_user: string;
}

// Helper interface to extract unique roles from role action presets
export interface RoleFromActionPreset {
  id: number;
  role_name: string;
  status_id: number;
  status_name: string;
  role_level?: number;
}
