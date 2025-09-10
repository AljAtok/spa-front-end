export interface AuditTrailLog {
  id: number;
  service: string;
  method: string;
  raw_data: string;
  description: string;
  status_id: number;
  status_name: string;
  created_at: string;
  created_by: number;
  created_user: string;
  [key: string]: unknown;
}
