// src/types/ModuleTypes.ts

export interface Module {
  id: number;
  module_name: string;
  module_alias: string;
  module_link: string;
  menu_title: string;
  parent_title: string;
  link_name: string;
  status_id: number;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  created_user: string;
  updated_user: string | null;
  status_name: string;
  [key: string]: unknown; // Add index signature to satisfy DatagridActions constraint
}

// Form values interface for create/edit
export interface ModuleFormValues {
  module_name: string;
  module_alias: string;
  module_link: string;
  menu_title: string;
  parent_title: string;
  link_name: string;
  order_level: number;
  status: 1 | 2; // Using 1 for Active, 2 for Inactive
}
