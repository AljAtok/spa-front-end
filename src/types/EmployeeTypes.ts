export interface EmployeeLocation {
  location_id: number;
  location_name: string;
}

export interface Employee {
  id: number;
  employee_number: string;
  employee_first_name: string;
  employee_last_name: string;
  employee_email: string;
  locations: EmployeeLocation[];
  position_id: number;
  position_name: string;
  position_abbr: string;
  status_id: 1 | 2;
  status_name: string;
  created_at: string;
  created_by: number;
  updated_by: number | null;
  modified_at: string;
  created_user: string;
  updated_user: string | null;
  [key: string]: unknown;
}

export interface EmployeeFormValues {
  employee_number: string;
  employee_first_name: string;
  employee_last_name: string;
  employee_email?: string;
  location_ids: number[];
  position_id: number;
  status: 1 | 2;
}
