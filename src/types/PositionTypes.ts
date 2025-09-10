// src/types/PositionTypes.ts
export interface Position {
  id: number;
  position_name: string;
  position_abbr: string;
  status_id: number;
  created_at: string;
  created_by: number | null;
  updated_by: number | null;
  modified_at: string;
  status_name: string;
  created_user: string | null;
  updated_user: string | null;
  [key: string]: unknown;
}

export interface PositionFormValues {
  position_name: string;
  position_abbr: string;
  status: 1 | 2;
}
