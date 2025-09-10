// src/types/TempPasswordTypes.ts
export interface TempPasswordChangeFormValues {
  new_password: string;
  confirm_password: string;
}

export interface TempPasswordUpdatePayload {
  new_password: string;
}
