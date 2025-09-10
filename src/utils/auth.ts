// src/utils/auth.ts

// import { useApi } from "@/hooks/useApi";
import { jwtDecode } from "jwt-decode";
// import { decode } from "punycode";
import {
  secureGetAuthToken,
  secureGetRefreshToken,
  secureStoreAuthTokens,
  secureLogout,
  migrateToSecureTokens,
  secureGetUserData,
} from "./secureAuth";
import { safeHasAuthCredentials } from "./authSafetyCheck";

interface DecodedToken {
  exp: number; // Expiration time as Unix timestamp
  user_id?: number; // User ID from token
  // Add other properties expected in token payload
  [key: string]: unknown;
}

/**
 * Checks if an authentication token exists in localStorage or sessionStorage.
 * Enhanced with secure token support and automatic migration.
 * @returns {string | null} The token string if present, otherwise null.
 */
export const getAuthToken = (): string | null => {
  // Try secure storage first
  const secureToken = secureGetAuthToken();
  if (secureToken) {
    return secureToken;
  }

  // Fallback to legacy storage
  const legacyToken =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // If we have legacy tokens, trigger migration
  if (legacyToken) {
    console.debug("🔄 Legacy token detected, attempting migration...");
    migrateToSecureTokens();
    // Return the secure token after migration
    return secureGetAuthToken() || legacyToken;
  }

  return null;
};

/**
 * Gets the access token directly from storage without any validation.
 * Enhanced with secure storage support and automatic migration.
 * Used by axios interceptor for token refresh operations.
 * @returns {string | null} The access token if present, otherwise null.
 */
export const getAccessToken = (): string | null => {
  return getAuthToken(); // Use the enhanced getAuthToken function
};

/**
 * Checks if the stored authentication token is valid and not expired.
 * @returns {boolean} True if the token is valid and not expired, false otherwise.
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    console.debug("No authentication token found");
    return false;
  }

  try {
    const decodedToken: DecodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds    // Check if the token has an expiration time and if it's in the future
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      console.warn(
        "Authentication token expired at:",
        new Date(decodedToken.exp * 1000)
      );
      // DON'T clear the expired token here - let axios interceptor handle refresh
      // The token might still be refreshable via refresh token
      return false;
    }

    console.debug(
      "Authentication token is valid, expires at:",
      new Date(decodedToken.exp * 1000)
    );
    return true;
  } catch (error) {
    console.error("Error decoding or validating token:", error);
    localStorage.removeItem("authToken"); // Clear invalid token
    return false;
  }
};

/**
 * Checks if user has authentication credentials (access token or refresh token).
 * Enhanced with secure storage support and comprehensive validation.
 * This is more lenient than isAuthenticated() and allows for token refresh attempts.
 * Now includes additional validation to prevent infinite redirects.
 * @returns {boolean} True if user has any auth credentials, false otherwise.
 */
export const hasAuthCredentials = (): boolean => {
  // Use safe check to prevent infinite loops during auth errors
  return safeHasAuthCredentials();
};

/**
 * Gets the logged user ID from the stored token or user data.
 * Enhanced with secure storage support.
 * @returns {number | null} The user ID if found, otherwise null.
 */
export const getLoggedUserId = (): number | null => {
  console.debug("🔍 getLoggedUserId called");
  // First try to get from token
  const token = getAuthToken();
  if (token) {
    try {
      const decodedToken: DecodedToken = jwtDecode(token);

      // Check multiple possible user ID field names
      const possibleUserIdFields = ["user_id", "userId", "id", "sub", "uid"];

      for (const field of possibleUserIdFields) {
        if (field in decodedToken) {
          const userId = (decodedToken as Record<string, unknown>)[field];
          if (typeof userId === "number" && userId > 0) {
            console.debug(
              `✅ User ID found in token field '${field}':`,
              userId
            );
            return userId;
          } else if (typeof userId === "string" && userId !== "") {
            const numericUserId = parseInt(userId, 10);
            if (!isNaN(numericUserId) && numericUserId > 0) {
              console.debug(
                `✅ User ID found in token field '${field}' (converted from string):`,
                numericUserId
              );
              return numericUserId;
            }
          }
        }
      }

      console.debug(
        "⚠️ No valid user ID found in token, decoded token:",
        decodedToken
      );
    } catch (error) {
      console.error("❌ Error decoding token for user ID:", error);
    }
  } else {
    console.debug("⚠️ No token found for user ID extraction");
  } // Try secure storage first
  try {
    const secureUserData = secureGetUserData();
    if (secureUserData && typeof secureUserData === "object") {
      const possibleIdFields = ["id", "user_id", "userId", "ID"];

      for (const field of possibleIdFields) {
        if (field in secureUserData) {
          const userId = (secureUserData as Record<string, unknown>)[field];
          if (typeof userId === "number" && userId > 0) {
            console.debug(
              `✅ User ID found in secure storage field '${field}':`,
              userId
            );
            return userId;
          } else if (typeof userId === "string" && userId !== "") {
            const numericUserId = parseInt(userId, 10);
            if (!isNaN(numericUserId) && numericUserId > 0) {
              console.debug(
                `✅ User ID found in secure storage field '${field}' (converted from string):`,
                numericUserId
              );
              return numericUserId;
            }
          }
        }
      }

      console.debug(
        "⚠️ No valid user ID found in secure storage, user data:",
        secureUserData
      );
    }
  } catch (error) {
    console.debug("⚠️ Could not retrieve user ID from secure storage:", error);
  }
  // Fallback: try to get from legacy stored user data
  try {
    const userData =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const possibleIdFields = ["id", "user_id", "userId", "ID"];

      for (const field of possibleIdFields) {
        if (field in user) {
          const userId = user[field];
          if (typeof userId === "number" && userId > 0) {
            console.debug(
              `✅ User ID found in legacy storage field '${field}':`,
              userId
            );
            return userId;
          } else if (typeof userId === "string" && userId !== "") {
            const numericUserId = parseInt(userId, 10);
            if (!isNaN(numericUserId) && numericUserId > 0) {
              console.debug(
                `✅ User ID found in legacy storage field '${field}' (converted from string):`,
                numericUserId
              );
              return numericUserId;
            }
          }
        }
      }

      console.debug(
        "⚠️ No valid user ID found in legacy storage, user data:",
        user
      );
    } else {
      console.debug("⚠️ No user data found in legacy storage");
    }
  } catch (error) {
    console.error("❌ Error parsing legacy user data:", error);
  }
  console.warn(
    "❌ No user ID found in token, secure storage, or legacy storage"
  );

  // Call debug function to help diagnose the issue
  debugAuthData();

  return null;
};

/**
 * Gets the refresh token from localStorage or sessionStorage.
 * Enhanced with secure storage support and automatic migration.
 * @returns {string | null} The refresh token if present, otherwise null.
 */
export const getRefreshToken = (): string | null => {
  // Try secure storage first
  const secureToken = secureGetRefreshToken();
  if (secureToken) {
    return secureToken;
  }

  // Fallback to legacy storage
  const refreshToken =
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken");

  console.debug(
    "Refresh token availability:",
    refreshToken ? "present" : "not found"
  );

  // If we have legacy token, trigger migration
  if (refreshToken) {
    console.debug("🔄 Legacy refresh token detected, attempting migration...");
    migrateToSecureTokens();
    return secureGetRefreshToken() || refreshToken;
  }

  return null;
};

/**
 * Clears the authentication token and any user data from storage.
 * Enhanced with secure storage support.
 * Note: Navigation should be handled by the calling component.
 */
export const logout = async (
  postFn?: (
    url: string,
    data: unknown,
    message?: string,
    headers?: Record<string, string>
  ) => Promise<unknown>
): Promise<void> => {
  console.log("🚪 Logout initiated");

  // Try to call logout API, but don't let it fail the logout process
  if (postFn) {
    try {
      const token = getAuthToken();
      const headers = token
        ? { Authorization: `Bearer_c+gi ${token}` }
        : undefined;
      await postFn("/auth/logout", {}, "Logged out successfully.", headers);
      console.log("✅ Logout API call successful");
    } catch (error) {
      console.warn(
        "⚠️ Logout API call failed, but continuing with local logout:",
        error
      );
      // Don't throw error here - we've already cleared local data
    }
  }

  // Clear local auth data first to prevent loops
  secureLogout();
  console.log("🧹 Local auth data cleared");

  console.log("🧹 User logged out and all auth data cleared.");

  // Trigger a custom event that the App component can listen to
  window.dispatchEvent(new CustomEvent("authLogout"));
};

/**
 * Cleans up stale session data that might cause infinite redirects.
 * Should be called when the app starts to ensure clean authentication state.
 */
export const cleanupStaleSession = (): void => {
  console.debug("🧹 Cleaning up stale session data...");

  // Check if we have any valid auth session
  const hasLocalAuth =
    localStorage.getItem("authToken") || localStorage.getItem("refreshToken");
  const hasSessionAuth =
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("refreshToken");

  // If we have any active auth session, don't clean it up
  if (hasLocalAuth || hasSessionAuth) {
    console.debug("✅ Active auth session found, skipping cleanup");
    return;
  }

  // Only clean up if there are no active auth sessions anywhere
  console.debug("🧹 No active auth sessions found, cleaning up stale data");

  // Clear sessionStorage completely to prevent stale data issues
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach((key) => {
    if (
      key.includes("auth") ||
      key.includes("Token") ||
      key.includes("user") ||
      key.includes("rememberMe")
    ) {
      sessionStorage.removeItem(key);
      console.debug(`🧹 Removed stale sessionStorage key: ${key}`);
    }
  });

  // Clear localStorage tokens if they exist without proper rememberMe flag
  const localRememberMe = localStorage.getItem("rememberMe") === "true";
  if (hasLocalAuth && !localRememberMe) {
    console.debug(
      "🧹 Cleaning orphaned localStorage tokens (rememberMe was false)"
    );
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
  }

  console.debug("✅ Session cleanup completed");
};

/**
 * Debug function to inspect stored authentication data
 * This will help identify why user ID extraction is failing
 */
export const debugAuthData = (): void => {
  console.log("🔍 ======= AUTH DEBUG REPORT =======");

  // Check token
  const token = getAuthToken();
  console.log("📋 Raw token exists:", !!token);

  if (token) {
    try {
      const decoded = jwtDecode(token);
      console.log("📋 Decoded token:", decoded);
      console.log("📋 Token has user_id:", "user_id" in decoded);
      console.log("📋 Token user_id value:", (decoded as DecodedToken).user_id);
    } catch (error) {
      console.log("❌ Token decode error:", error);
    }
  }

  // Check secure storage
  try {
    const secureUserData = secureGetUserData();
    console.log("📋 Secure user data exists:", !!secureUserData);
    console.log("📋 Secure user data:", secureUserData);
    if (secureUserData && typeof secureUserData === "object") {
      console.log("📋 User data has 'id' field:", "id" in secureUserData);
      console.log(
        "📋 User data 'id' value:",
        (secureUserData as { id?: number }).id
      );
    }
  } catch (error) {
    console.log("❌ Secure storage error:", error);
  }

  // Check legacy storage
  try {
    const legacyUserData =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (legacyUserData) {
      const parsed = JSON.parse(legacyUserData);
      console.log("📋 Legacy user data:", parsed);
      console.log("📋 Legacy user data has 'id':", "id" in parsed);
    } else {
      console.log("📋 No legacy user data found");
    }
  } catch (error) {
    console.log("❌ Legacy storage error:", error);
  }

  console.log("🔍 ======= END DEBUG REPORT =======");
};

/**
 * Storage utilities for Remember Me functionality
 */

/**
 * Gets the appropriate storage based on remember me preference
 * @param rememberMe - Whether to use persistent storage
 * @returns Storage object (localStorage or sessionStorage)
 */
const getStorage = (rememberMe: boolean): Storage => {
  return rememberMe ? localStorage : sessionStorage;
};

/**
 * Gets the current storage type being used for auth tokens
 * @returns 'localStorage' | 'sessionStorage' | null
 */
export const getCurrentStorageType = ():
  | "localStorage"
  | "sessionStorage"
  | null => {
  if (
    localStorage.getItem("authToken") ||
    localStorage.getItem("refreshToken")
  ) {
    return "localStorage";
  }
  if (
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("refreshToken")
  ) {
    return "sessionStorage";
  }
  return null;
};

/**
 * Stores authentication tokens based on remember me preference.
 * Enhanced with secure storage and automatic encryption.
 * @param accessToken - The access token to store
 * @param refreshToken - The refresh token to store
 * @param userData - User data to store
 * @param rememberMe - Whether to persist tokens across browser sessions
 */
export const storeAuthTokens = (
  accessToken: string,
  refreshToken: string,
  userData: object,
  rememberMe: boolean = false
): void => {
  console.log("🔄 Storing tokens with secure storage...");

  // Use secure storage by default, with legacy fallback for compatibility
  try {
    secureStoreAuthTokens(accessToken, refreshToken, userData, rememberMe);
  } catch (error) {
    console.warn(
      "⚠️ Secure storage failed, falling back to legacy storage:",
      error
    );

    // Fallback to legacy storage
    const storage = getStorage(rememberMe);
    clearAllAuthTokens();

    storage.setItem("authToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("rememberMe", rememberMe.toString());

    console.log(
      `🔐 Auth tokens stored in ${
        rememberMe
          ? "localStorage (persistent)"
          : "sessionStorage (session-only)"
      } using legacy storage`
    );
  }
};

/**
 * Clears authentication tokens from both localStorage and sessionStorage
 * @param clearRememberedEmail - Whether to also clear the remembered email (default: false)
 */
export const clearAllAuthTokens = (
  clearRememberedEmail: boolean = false
): void => {
  // Clear from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  const currentStorageType = getCurrentStorageType();
  if (currentStorageType && currentStorageType !== "localStorage") {
    localStorage.removeItem("rememberMe");
  }
  localStorage.removeItem("rememberMe");

  // Clear from sessionStorage
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("rememberMe");

  // Optionally clear remembered email
  if (clearRememberedEmail) {
    localStorage.removeItem("rememberedEmail");
  }

  console.log(
    `🧹 Auth tokens cleared from both localStorage and sessionStorage${
      clearRememberedEmail ? " (including remembered email)" : ""
    }`
  );
};

/**
 * Gets the remember me preference from storage
 * @returns boolean indicating if remember me was enabled
 */
export const getRememberMePreference = (): boolean => {
  // Check for current active storage type first
  const currentStorageType = getCurrentStorageType();

  if (currentStorageType === "localStorage") {
    return localStorage.getItem("rememberMe") === "true";
  }

  if (currentStorageType === "sessionStorage") {
    return sessionStorage.getItem("rememberMe") === "true";
  }

  // If no auth tokens exist, check if we have a remembered email
  // This indicates the user previously used "Remember me"
  const hasRememberedEmail = !!localStorage.getItem("rememberedEmail");

  console.debug("🔍 getRememberMePreference - no active auth:", {
    currentStorageType,
    hasRememberedEmail,
  });

  return hasRememberedEmail;
};
