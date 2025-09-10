// User Types
export interface User {
  id: number;
  user_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role_id: number;
  role_name: string;
  emp_number: string;
  email: string;
  user_reset: boolean;
  user_upline_id: number | null;
  user_upline_name: string | null;
  email_switch: boolean;
  status_id: number;
  theme_id: number;
  theme_name: string;
  profile_pic_url: string | null;
  last_login: string | null;
  last_logout: string | null;
  is_logout: boolean;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  created_user: string;
  updated_user: string | null;
  status_name: string;
  module_name: string[];
  action_name: string[];
  location_name: string[];
  [key: string]: unknown; // Add index signature for DataGrid
}

// Nested Role Preset Response Types
export interface NestedRolePresetAction {
  id: number;
  action_name: string;
  status_id: number;
}

export interface NestedRolePresetModule {
  id: number;
  module_name: string;
  module_alias: string;
  module_link: string;
  menu_title: string;
  parent_title: string;
  link_name: string;
  status_id: number;
  created_at: string;
  modified_at: string;
  actions: NestedRolePresetAction[];
}

export interface NestedRolePresetLocation {
  id: number;
  location_name: string;
  status_id: number;
}

export interface NestedRolePresetRole {
  id: number;
  role_name: string;
  role_level: number;
  status_id: number;
  created_at: string;
  modified_at: string;
}

export interface NestedRolePresetStatus {
  id: number;
  status_name: string;
}

export interface NestedRolePresetUser {
  id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface NestedRolePresetResponse {
  role_id: number;
  location_ids: number[];
  modules: NestedRolePresetModule[];
  presets: Array<{
    module_ids: number;
    action_ids: number[];
  }>;
}

// Nested User Response Types (for edit mode)
export interface NestedUserAction {
  id: number;
  action_name: string;
  status_id: number;
  permission_status_id: number;
}

export interface NestedUserModule {
  id: number;
  module_name: string;
  module_alias: string;
  module_link: string;
  menu_title: string;
  parent_title: string;
  link_name: string;
  order_level: number;
  status_id: number;
  created_at: string;
  modified_at: string;
  actions: NestedUserAction[];
}

export interface NestedUserAccessKey {
  id: number;
  access_key_name: string;
  status_id: number;
}

export interface NestedUserLocation {
  id: number;
  location_name: string;
  status_id: number;
  user_location_status_id: number;
}

export interface NestedUserTheme {
  id: number;
  theme_name: string;
  status_id: number;
}

export interface NestedUserResponse {
  user_id: number;
  user: {
    id: number;
    user_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    emp_number: string;
    email: string;
    user_reset: boolean;
    user_upline_id: number | null;
    email_switch: boolean;
    profile_pic_url: string;
    created_at: string;
    modified_at: string;
  };
  role: NestedRolePresetRole;
  access_keys: NestedUserAccessKey[];
  modules: NestedUserModule[];
  locations: NestedUserLocation[];
  user_upline: NestedRolePresetUser | null;
  theme: NestedUserTheme;
  status: NestedRolePresetStatus;
  created_by: NestedRolePresetUser;
  updated_by: NestedRolePresetUser;
  created_at: string;
  modified_at: string;
}

export interface UserFormValues {
  user_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role_id: number;
  emp_number: string;
  email: string;
  password?: string; // Added for user creation
  user_reset: boolean;
  user_upline_id?: number;
  email_switch: boolean;
  status_id: 1 | 2;
  theme_id: number;
  profile_pic_url?: string;
  created_by?: number; // Added from sample JSON
  access_key_id?: number[]; // Added from sample JSON
  location_ids: number[];
  user_permission_presets: Array<{
    module_ids: number;
    action_ids: number[];
  }>;
}

export interface UserInfo {
  id: number;
  full_name: string;
  role_name?: string;
}

export interface UserLoggedData {
  user_id: number;
  user: {
    id: number;
    user_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    emp_number: string;
    email: string;
    user_reset: boolean;
    user_upline_id: number | null;
    email_switch: boolean;
    profile_pic_url: string;
    created_at: string;
    modified_at: string;
    current_access_key?: number;
    current_access_key_name?: string;
  };
  access_keys: {
    id: number;
    access_key_name: string;
    status_id: number;
    user_access_key_status_id: number;
  }[];
  role: {
    id: number;
    role_name: string;
    role_level: number;
    status_id: number;
  };
  // ... other properties
}

export interface UserAccessKeyData {
  user_id: number;
  user_name: string;
  full_name: string;
  current_access_key?: number;
  available_access_keys: {
    id: number;
    access_key_name: string;
    status_id: number;
    is_current: boolean;
  }[];
}
