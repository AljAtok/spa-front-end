// src/api/axiosConfig.ts
import axios from "axios";
import {
  logout,
  getRefreshToken,
  getAccessToken,
  getRememberMePreference,
} from "../utils/auth";
import { generateCSRFToken, validateRequestOrigin } from "../utils/security";
import {
  migrateToSecureTokens,
  secureStoreAuthTokens,
  secureGetUserData,
} from "../utils/secureAuth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const TOKEN_PREFIX = "Bearer_c+gi"; // Define the token prefix for Authorization header

// Store a reference to the post function for logout calls
let logoutPostFn:
  | ((url: string, data: unknown, message?: string) => Promise<unknown>)
  | null = null;

// Flag to prevent multiple concurrent logout attempts
let isLoggingOut = false;

// Function to set the logout post function (called from components that use useApi)
export const setLogoutPostFn = (
  postFn: (url: string, data: unknown, message?: string) => Promise<unknown>
) => {
  logoutPostFn = postFn;
};

// Function to reset logout flag (for testing or recovery purposes)
export const resetLogoutFlag = () => {
  isLoggingOut = false;
};

// Expose resetLogoutFlag globally for debugging
if (typeof window !== "undefined") {
  (window as typeof window & { resetLogoutFlag: () => void }).resetLogoutFlag =
    resetLogoutFlag;
}

// Define timeout configurations for different operation types
const TIMEOUT_CONFIG = {
  DEFAULT: 240000, // 4 minutes for most operations
  LARGE_DATA: 240000, // 4 minutes for large data operations (POST/PATCH with big payloads)
  FILE_UPLOAD: 300000, // 5 minutes for file uploads
  REPORTS: 180000, // 3 minutes for report generation
  REFRESH_TOKEN: 15000, // 15 seconds for token refresh (should be fast)
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // CORS configuration for frontend
  withCredentials: true, // Enable sending cookies and auth headers
  timeout: TIMEOUT_CONFIG.DEFAULT, // Default 30 second timeout
});

// Migrate legacy tokens to secure storage on startup
try {
  migrateToSecureTokens();
} catch (error) {
  console.warn("⚠️ Failed to migrate legacy tokens:", error);
}

// Validate request origin for CSRF protection
if (!validateRequestOrigin()) {
  console.error("🚨 Request origin validation failed - potential CSRF attack");
}

let isRefreshing = false; // Flag to prevent multiple refresh requests simultaneously
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  console.log(
    `🔄 Processing queue: ${
      failedQueue.length
    } requests, error: ${!!error}, token: ${!!token}`
  );

  failedQueue.forEach((prom) => {
    if (error) {
      console.log("❌ Rejecting queued request due to error");
      prom.reject(error);
    } else if (token) {
      console.log("✅ Resolving queued request with new token");
      prom.resolve(token);
    } else {
      console.log("❌ No token available for queued request");
      prom.reject(new Error("No token available"));
    }
  });

  failedQueue = [];
  console.log("🔄 Queue processed and cleared");
};

// Function to determine appropriate timeout based on request characteristics
const getRequestTimeout = (
  config: import("axios").AxiosRequestConfig
): number => {
  const url = config.url?.toLowerCase() || "";
  const method = config.method?.toLowerCase() || "";

  // File upload operations
  if (url.includes("upload") || url.includes("file")) {
    return TIMEOUT_CONFIG.FILE_UPLOAD;
  }

  // Report generation
  if (url.includes("report") || url.includes("export")) {
    return TIMEOUT_CONFIG.REPORTS;
  }

  // Token refresh should be fast
  if (url.includes("refresh-token")) {
    return TIMEOUT_CONFIG.REFRESH_TOKEN;
  }

  // Large data operations (POST/PATCH with substantial payloads)
  if ((method === "post" || method === "patch") && config.data) {
    const dataSize = JSON.stringify(config.data).length;
    // If payload is larger than 10KB, use extended timeout
    if (dataSize > 10240) {
      return TIMEOUT_CONFIG.LARGE_DATA;
    }
  }

  // Bulk operations
  if (url.includes("bulk") || url.includes("batch")) {
    return TIMEOUT_CONFIG.LARGE_DATA;
  }

  return TIMEOUT_CONFIG.DEFAULT;
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Set dynamic timeout based on request characteristics
    config.timeout = getRequestTimeout(config);

    // Log timeout for debugging large operations
    if (config.timeout > TIMEOUT_CONFIG.DEFAULT) {
      console.log(
        `⏱️ Extended timeout set for request: ${config.timeout}ms for ${config.url}`
      );
    }

    // Add security headers
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";

    // Add CSRF token for state-changing requests
    if (
      config.method &&
      ["post", "put", "patch", "delete"].includes(config.method.toLowerCase())
    ) {
      const csrfToken = generateCSRFToken();
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    // Get fresh token for each request
    const token = getAccessToken(); // Use utility function that doesn't validate expiration
    if (token) {
      config.headers.Authorization = `${TOKEN_PREFIX} ${token}`;
      console.log(
        `🔐 Request with token: ${TOKEN_PREFIX} ${token.substring(0, 20)}...`
      );
    } else {
      console.log("⚠️ No token available for request");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for token refreshing
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh logic for logout endpoint to prevent infinite loops
    if (originalRequest.url && originalRequest.url.includes("/auth/logout")) {
      console.log("🚪 Logout endpoint failed, skipping token refresh logic");
      return Promise.reject(error);
    }

    // Prevent multiple concurrent logout attempts
    if (isLoggingOut) {
      console.log("🚪 Logout already in progress, skipping token refresh");
      return Promise.reject(error);
    }

    // Check if it's a 401 and not already retrying
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      console.log("🔄 401 Unauthorized detected, attempting token refresh...");
      originalRequest._retry = true; // Mark this request as retried

      const refreshToken = getRefreshToken();

      // If no refresh token available, force logout
      if (!refreshToken) {
        console.warn("❌ No refresh token available, logging out user");
        isLoggingOut = true;
        try {
          await logout(logoutPostFn || undefined);
        } catch (logoutError) {
          console.error("Error during logout:", logoutError);
        } finally {
          isLoggingOut = false;
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If a refresh is already in progress, queue the original request
        console.log("🔄 Token refresh in progress, queuing request...");
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(async (token) => {
            if (token) {
              // Add small delay for queued requests too
              await new Promise((resolve) => setTimeout(resolve, 200));

              // Force fresh token retrieval instead of using the passed token
              delete originalRequest.headers.Authorization;
              const freshToken = getAccessToken();
              if (freshToken) {
                originalRequest.headers.Authorization = `${TOKEN_PREFIX} ${freshToken}`;
                console.log(
                  `🔄 Retrying queued request with fresh token: ${TOKEN_PREFIX} ${freshToken.substring(
                    0,
                    20
                  )}...`
                );
                console.log(
                  `🔍 Queued request auth header: Authorization: ${originalRequest.headers.Authorization.substring(
                    0,
                    50
                  )}...`
                );
                return api(originalRequest);
              } else {
                console.error(
                  "❌ No fresh token available for queued request!"
                );
                return Promise.reject(new Error("No fresh token available"));
              }
            } else {
              return Promise.reject(new Error("Token refresh failed"));
            }
          })
          .catch((err) => {
            console.error("❌ Queued request failed:", err);
            return Promise.reject(err);
          });
      }

      isRefreshing = true; // Set flag to indicate refresh process has started

      try {
        console.log("Attempting to refresh token..."); // Call refresh token endpoint with clean axios instance to avoid interceptor loops
        const refreshResponse = await axios.create().post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: TIMEOUT_CONFIG.REFRESH_TOKEN, // Use specific timeout for token refresh
          }
        );
        console.log("✅ Token refresh successful");
        const newAccessToken = refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;

        if (!newAccessToken) {
          throw new Error("No access token in refresh response");
        }
        console.log("🔄 Storing new tokens...");

        // Get the current remember me preference and store tokens accordingly
        const rememberMe = getRememberMePreference();
        const storage = rememberMe ? localStorage : sessionStorage;

        // Store new tokens using the same storage type as before
        storage.setItem("authToken", newAccessToken);
        if (newRefreshToken) {
          storage.setItem("refreshToken", newRefreshToken);
        }

        // Also update secure storage if it exists to maintain consistency
        try {
          const existingUserData = secureGetUserData();
          if (existingUserData) {
            console.log("🔐 Updating secure storage with new tokens...");
            secureStoreAuthTokens(
              newAccessToken,
              newRefreshToken || refreshToken,
              existingUserData,
              rememberMe,
              true
            );
          }
        } catch (error) {
          console.warn("⚠️ Could not update secure storage:", error);
        }

        console.log(
          `💾 New tokens stored successfully in ${
            rememberMe ? "localStorage" : "sessionStorage"
          }`
        );

        // Verify token was actually stored
        const verifyToken = storage.getItem("authToken");
        if (verifyToken === newAccessToken) {
          console.log("✅ Token storage verified successfully");
        } else {
          console.error("❌ Token storage verification failed!");
          console.error("Expected:", newAccessToken.substring(0, 20) + "...");
          console.error(
            "Actual:",
            verifyToken ? verifyToken.substring(0, 20) + "..." : "null"
          );
        }

        // Update axios default headers with new token
        delete api.defaults.headers.common["Authorization"];
        api.defaults.headers.common[
          "Authorization"
        ] = `${TOKEN_PREFIX} ${newAccessToken}`;
        console.log(
          `🔄 Updated axios defaults with new token: ${TOKEN_PREFIX} ${newAccessToken.substring(
            0,
            20
          )}...`
        );

        // Update the original request header with the NEW token directly
        delete originalRequest.headers.Authorization;
        originalRequest.headers.Authorization = `${TOKEN_PREFIX} ${newAccessToken}`;
        console.log(
          `🔄 Updated original request with new token: ${TOKEN_PREFIX} ${newAccessToken.substring(
            0,
            20
          )}...`
        );

        // Process queued requests with the new token
        processQueue(null, newAccessToken);

        console.log("🔄 Retrying original request with refreshed token");

        // Small delay to allow backend token propagation
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Retry the original request with the new token
        try {
          const retryResponse = await api(originalRequest);
          console.log("✅ Token refresh and retry successful!");
          return retryResponse;
        } catch (retryError: unknown) {
          console.error(
            "❌ Request still failed after token refresh:",
            retryError
          );
          // Log details for debugging
          if (retryError instanceof Error && "response" in retryError) {
            const response = (retryError as { response?: { status: number } })
              .response;
            console.error("🔍 Retry failure details:", {
              status: response?.status,
              url: originalRequest.url,
              tokenUsed: originalRequest.headers.Authorization
                ? originalRequest.headers.Authorization.substring(0, 30) + "..."
                : "no auth header",
            });
          }

          // If it's still a 401, the refresh token might be invalid
          if (
            retryError instanceof Error &&
            "response" in retryError &&
            (retryError as { response?: { status: number } }).response
              ?.status === 401
          ) {
            console.error(
              "🚨 Still getting 401 after refresh - refresh token may be invalid"
            );
            // Force logout if refresh token is also invalid
            console.log("🚪 Forcing logout due to invalid refresh token...");
            if (!isLoggingOut) {
              isLoggingOut = true;
              try {
                await logout(logoutPostFn || undefined);
              } catch (logoutError) {
                console.error("Error during logout:", logoutError);
              } finally {
                isLoggingOut = false;
              }
            }
            return Promise.reject(new Error("Refresh token is invalid"));
          }

          throw retryError;
        }
      } catch (refreshError: unknown) {
        console.error("❌ Failed to refresh token:", refreshError); // Log more details about the refresh error for debugging
        if (refreshError instanceof Error) {
          console.error("🔍 Refresh error message:", refreshError.message);
        }

        // Refresh token failed, force logout
        console.log("🚪 Refresh token failed, logging out user...");
        if (!isLoggingOut) {
          isLoggingOut = true;
          try {
            await logout(logoutPostFn || undefined);
          } catch (logoutError) {
            console.error("Error during logout:", logoutError);
          } finally {
            isLoggingOut = false;
          }
        }
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Reset refresh flag
      }
    }

    // For any other non-401 error, or if 401 after retry
    return Promise.reject(error);
  }
);

// Export timeout configurations for use in components
export const AXIOS_TIMEOUTS = TIMEOUT_CONFIG;

// Utility function to create a custom axios instance with specific timeout
export const createCustomTimeoutApi = (timeout: number) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: timeout,
  });
};

export default api;
