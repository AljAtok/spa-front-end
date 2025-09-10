// src/api/tempPasswordApi.ts
import { AxiosRequestConfig } from "axios";
import { TempPasswordUpdatePayload } from "../types/TempPasswordTypes";

interface ApiMethods {
  put: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

// Change temporary password
export const changeTempPassword = async (
  { put }: Pick<ApiMethods, "put">,
  userId: string,
  passwordData: TempPasswordUpdatePayload
): Promise<{ success: boolean; message: string }> => {
  return put<{ success: boolean; message: string }>(
    `/users/${userId}/change-temp-password`,
    passwordData,
    "Password changed successfully"
  );
};
