// src/api/profileApi.ts
import { AxiosRequestConfig } from "axios";
import {
  ProfileUpdatePayload,
  PasswordUpdatePayload,
} from "../types/ProfileTypes";

interface ApiMethods {
  get: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  put: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  post: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

// Update user profile information
export const updateUserProfile = async (
  { put }: Pick<ApiMethods, "put">,
  userId: string,
  profileData: ProfileUpdatePayload
): Promise<{ success: boolean; message: string }> => {
  return put<{ success: boolean; message: string }>(
    `/users/${userId}/profile`,
    profileData,
    "Profile updated successfully"
  );
};

// Change user password
export const changeUserPassword = async (
  { put }: Pick<ApiMethods, "put">,
  userId: string,
  passwordData: PasswordUpdatePayload
): Promise<{ success: boolean; message: string }> => {
  return put<{ success: boolean; message: string }>(
    `/users/${userId}/password`,
    passwordData,
    "Password changed successfully"
  );
};

// Upload profile picture
export const uploadProfilePicture = async (
  { post }: Pick<ApiMethods, "post">,
  userId: string,
  file: File
): Promise<{ success: boolean; message: string; profile_pic_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  console.log(
    "Uploading file:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type
  );

  return post<{ success: boolean; message: string; profile_pic_url: string }>(
    `/users/${userId}/profile-picture`,
    formData,
    "Profile picture uploaded successfully",
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};
