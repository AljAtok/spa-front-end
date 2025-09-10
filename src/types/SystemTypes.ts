// src/types/SystemTypes.ts

export interface System {
  id: string | number; // Assuming ID can be string or number
  system_code: string;
  system_name: string;
  status: string;
  // Add any other properties system data might have
  [key: string]: unknown; // Allow for other properties if unsure of all keys
}
