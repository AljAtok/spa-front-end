// src/types/ProfileTypes.ts
export interface ProfileFormValues {
  first_name: string;
  last_name: string;
  profile_pic_url?: string;
}

export interface PasswordChangeFormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileUpdatePayload {
  first_name: string;
  last_name: string;
  profile_pic_url?: string;
}

export interface PasswordUpdatePayload {
  current_password: string;
  new_password: string;
}

export interface PasswordStrengthMetrics {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  feedback: string[];
}
