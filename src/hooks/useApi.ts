// src/hooks/useApi.ts

import { useCallback } from "react";
import { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { useSnackbar } from "notistack";
import api from "../api/axiosConfig";

// Define the ApiMethods interface
export interface ApiMethods {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  put: <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  patch: <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  del: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
}

// Define a common structure for API success responses if backend sends consistent messages
interface ApiResponseData {
  message?: string;
  // Add other common properties if API responses have them (e.g., data, id, etc.)
  [key: string]: unknown;
}

/**
 * Custom React Hook for making API calls with integrated Snackbar notifications.
 * It automatically handles success and error messages from Axios responses.
 *
 * @returns An object containing wrapped Axios methods: get, post, put, patch, del.
 */
export const useApi = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Helper function to handle common success logic
  const handleSuccess = useCallback(
    <T>(
      response: AxiosResponse<T>,
      defaultMessage: string,
      successVariant: "success" | "info" | "warning" = "success"
    ) => {
      let message = defaultMessage;
      // If the response data has a 'message' property, use it
      if (
        response.data &&
        typeof response.data === "object" &&
        "message" in response.data &&
        typeof response.data.message === "string"
      ) {
        message = (response.data as ApiResponseData).message!; // Assert it exists after check
      }
      enqueueSnackbar(message, { variant: successVariant });
      return response.data; // Return the actual response data
    },
    [enqueueSnackbar]
  );

  // Helper function to handle common error logic
  const handleError = useCallback(
    (error: unknown, defaultMessage: string, actionVerb: string) => {
      let errorMessage = defaultMessage;
      let snackbarVariant: "error" | "warning" = "error"; // Default to error

      if (error instanceof AxiosError) {
        console.error(`Axios error during ${actionVerb} API call:`, error);

        if (error.response) {
          // The request was made and the server responded with a status code
          const statusCode = error.response.status;
          const responseData = error.response.data;

          // Attempt to extract message from backend response data
          if (responseData && typeof responseData === "object") {
            if (
              "message" in responseData &&
              typeof responseData.message === "string"
            ) {
              errorMessage = responseData.message;
            } else {
              if (
                "error" in responseData &&
                typeof responseData.error === "string"
              ) {
                errorMessage = responseData.error;
              } else if (
                "error" in responseData &&
                Array.isArray(responseData.error)
              ) {
                errorMessage = responseData.error.join(", ");
              } else if (
                "errors" in responseData &&
                Array.isArray(responseData.errors)
              ) {
                errorMessage = responseData.errors.join(", ");
              }
            }
          } else if (typeof responseData === "string") {
            errorMessage = responseData; // If backend sends a plain string error message
          }

          // Determine snackbar variant based on HTTP status code
          if (statusCode >= 400 && statusCode < 500) {
            snackbarVariant = "warning";
            // Provide more specific fallbacks if backend message isn't clear
            if (statusCode === 404)
              errorMessage = errorMessage || `Resource not found.`;
            else if (statusCode === 403)
              errorMessage = errorMessage || `Permission denied.`;
            else if (statusCode === 400)
              errorMessage = errorMessage || `Invalid request data.`;
          } else if (statusCode >= 500) {
            snackbarVariant = "error";
            errorMessage =
              errorMessage || `Server error occurred. Please try again later.`;
          }
        } else if (error.request) {
          // The request was made but no response was received (e.g., network error)
          console.error("No response received from server:", error.request);
          errorMessage =
            "Network error: No response from server. Please check your internet connection.";
          snackbarVariant = "error";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error in Axios request configuration:", error.message);
          errorMessage = `An unexpected error occurred: ${error.message}`;
          snackbarVariant = "error";
        }
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        // A generic JavaScript error (not an AxiosError, but has a message property)
        console.error("Generic error:", error.message);
        errorMessage = error.message;
        snackbarVariant = "error";
      } else {
        // An entirely unknown error type
        console.error("An unknown error occurred:", error);
        errorMessage = `An unknown error occurred during ${actionVerb}.`;
        snackbarVariant = "error";
      }

      enqueueSnackbar(errorMessage, { variant: snackbarVariant });
      // Re-throw the error so the calling component can still handle it if needed
      throw error;
    },
    [enqueueSnackbar]
  );

  // --- Wrapped Axios Methods ---

  const get = useCallback(
    async <T = unknown>(
      url: string,
      defaultSuccessMessage?: string,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.get(url, config);
        // Only show success message if defaultSuccessMessage is provided
        if (defaultSuccessMessage) {
          return handleSuccess(response, defaultSuccessMessage);
        }
        return response.data; // Return data without showing snackbar if no message
      } catch (error) {
        handleError(
          error,
          defaultSuccessMessage || `Failed to fetch from ${url}`,
          "fetching"
        );
        throw error; // Re-throw the error
      }
    },
    [handleSuccess, handleError]
  );

  const post = useCallback(
    async <T = unknown, D = unknown>(
      url: string,
      data?: D,
      defaultSuccessMessage = "Operation ended successfully.",
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.post(url, data, config);
        return handleSuccess(response, defaultSuccessMessage);
      } catch (error) {
        console.log("Error in POST request:", error);
        handleError(error, defaultSuccessMessage, "creation");
        throw error;
      }
    },
    [handleSuccess, handleError]
  );

  const put = useCallback(
    async <T = unknown, D = unknown>(
      url: string,
      data?: D,
      defaultSuccessMessage = "Data updated successfully.",
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.put(url, data, config);
        return handleSuccess(response, defaultSuccessMessage);
      } catch (error) {
        handleError(error, defaultSuccessMessage, "update");
        throw error;
      }
    },
    [handleSuccess, handleError]
  );

  const patch = useCallback(
    async <T = unknown, D = unknown>(
      url: string,
      data?: D,
      defaultSuccessMessage = "Operation successful",
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response = await api.patch<T>(url, data, config);
        return handleSuccess(response, defaultSuccessMessage);
      } catch (error) {
        return handleError(error, "Could not update the resource", "update");
      }
    },
    [handleSuccess, handleError]
  );

  const del = useCallback(
    async <T = unknown>(
      url: string,
      defaultSuccessMessage = "Data deleted successfully.",
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.delete(url, config);
        return handleSuccess(response, defaultSuccessMessage);
      } catch (error) {
        handleError(error, defaultSuccessMessage, "deletion");
        throw error;
      }
    },
    [handleSuccess, handleError]
  );

  return { get, post, put, patch, del };
};
