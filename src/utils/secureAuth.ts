// src/utils/secureAuth.ts

import {
  encryptData,
  decryptData,
  validateTokenEntropy,
  generateSessionFingerprint,
  validateSessionFingerprint,
  sanitizeInput,
  generateCSRFToken,
  secureWipe,
} from "./security";

interface SecureTokenData {
  token: string;
  fingerprint: string;
  timestamp: number;
  entropy: boolean;
}

// interface SecureAuthCredentials {
//   accessToken: string;
//   refreshToken: string;
//   userData: object;
//   rememberMe: boolean;
// }

/**
 * Securely stores authentication tokens with encryption and validation
 */
export const secureStoreAuthTokens = (
  accessToken: string,
  refreshToken: string,
  userData: object,
  rememberMe: boolean = false,
  skipLogout: boolean = false // New parameter to prevent logout during refresh
): void => {
  console.debug("🔐 Starting secure token storage...");

  // Validate token entropy
  if (!validateTokenEntropy(accessToken)) {
    console.warn("⚠️ Access token has low entropy - potential security risk");
  }

  if (!validateTokenEntropy(refreshToken)) {
    console.warn("⚠️ Refresh token has low entropy - potential security risk");
  }

  // Generate session fingerprint
  const fingerprint = generateSessionFingerprint();
  const timestamp = Date.now();

  // Create secure token data structure
  const secureAccessToken: SecureTokenData = {
    token: accessToken,
    fingerprint,
    timestamp,
    entropy: validateTokenEntropy(accessToken),
  };

  const secureRefreshToken: SecureTokenData = {
    token: refreshToken,
    fingerprint,
    timestamp,
    entropy: validateTokenEntropy(refreshToken),
  };

  // Encrypt tokens and user data
  const encryptedAccessToken = encryptData(JSON.stringify(secureAccessToken));
  const encryptedRefreshToken = encryptData(JSON.stringify(secureRefreshToken));
  const encryptedUserData = encryptData(JSON.stringify(userData));
  // Determine storage type
  const storage = rememberMe ? localStorage : sessionStorage;

  // Clear any existing tokens from both storages first (skip logout during refresh)
  if (!skipLogout) {
    secureLogout(false);
  } else {
    console.debug(
      "🔄 Skipping logout during token refresh - preserving session"
    );
    // Just clear the storage items without triggering logout event
    const itemsToRemove = [
      "secureAuthToken",
      "secureRefreshToken",
      "secureUserData",
      "sessionFingerprint",
      "csrfToken",
      "rememberMe",
    ];

    itemsToRemove.forEach((item) => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });
  }

  try {
    // Store encrypted data
    storage.setItem("secureAuthToken", encryptedAccessToken);
    storage.setItem("secureRefreshToken", encryptedRefreshToken);
    storage.setItem("secureUserData", encryptedUserData);
    storage.setItem("rememberMe", rememberMe.toString());
    storage.setItem("sessionFingerprint", fingerprint);

    // Generate and store CSRF token
    const csrfToken = generateCSRFToken();
    storage.setItem("csrfToken", csrfToken);

    console.log(
      `🔐 Secure auth tokens stored in ${
        rememberMe
          ? "localStorage (persistent)"
          : "sessionStorage (session-only)"
      }`
    );

    // Securely wipe original tokens from memory
    secureWipe(accessToken);
    secureWipe(refreshToken);
  } catch (_error) {
    console.error("❌ Failed to store secure auth tokens:", _error);
    throw new Error("Failed to securely store authentication tokens");
  }
};

/**
 * Securely retrieves and validates authentication tokens
 */
export const secureGetAuthToken = (): string | null => {
  try {
    // Check both storage types
    const localEncrypted = localStorage.getItem("secureAuthToken");
    const sessionEncrypted = sessionStorage.getItem("secureAuthToken");

    const encryptedToken = localEncrypted || sessionEncrypted;
    if (!encryptedToken) {
      console.debug("🔍 No encrypted auth token found");
      return null;
    }

    // Decrypt and parse token data
    const decryptedData = decryptData(encryptedToken);
    const tokenData: SecureTokenData = JSON.parse(decryptedData);

    // Validate session fingerprint
    if (!validateSessionFingerprint(tokenData.fingerprint)) {
      console.warn(
        "⚠️ Session fingerprint validation failed - clearing tokens"
      );
      secureLogout();
      return null;
    }

    // Check token age (24 hours max)
    const tokenAge = Date.now() - tokenData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (tokenAge > maxAge) {
      console.warn("⚠️ Token too old - clearing tokens");
      secureLogout();
      return null;
    }

    // Warn about low entropy tokens
    if (!tokenData.entropy) {
      console.warn("⚠️ Retrieved token has low entropy");
    }

    console.debug("✅ Secure auth token retrieved and validated");
    return tokenData.token;
  } catch (error) {
    console.error("❌ Failed to retrieve secure auth token:", error);
    secureLogout(); // Clear potentially corrupted data
    return null;
  }
};

/**
 * Securely retrieves and validates refresh tokens
 */
export const secureGetRefreshToken = (): string | null => {
  try {
    // Check both storage types
    const localEncrypted = localStorage.getItem("secureRefreshToken");
    const sessionEncrypted = sessionStorage.getItem("secureRefreshToken");

    const encryptedToken = localEncrypted || sessionEncrypted;
    if (!encryptedToken) {
      console.debug("🔍 No encrypted refresh token found");
      return null;
    }

    // Decrypt and parse token data
    const decryptedData = decryptData(encryptedToken);
    const tokenData: SecureTokenData = JSON.parse(decryptedData);

    // Validate session fingerprint
    if (!validateSessionFingerprint(tokenData.fingerprint)) {
      console.warn(
        "⚠️ Session fingerprint validation failed - clearing tokens"
      );
      secureLogout();
      return null;
    }

    console.debug("✅ Secure refresh token retrieved and validated");
    return tokenData.token;
  } catch (error) {
    console.error("❌ Failed to retrieve secure refresh token:", error);
    secureLogout(); // Clear potentially corrupted data
    return null;
  }
};

/**
 * Securely retrieves and validates user data
 */
export const secureGetUserData = (): object | null => {
  try {
    // Check both storage types
    const localEncrypted = localStorage.getItem("secureUserData");
    const sessionEncrypted = sessionStorage.getItem("secureUserData");

    const encryptedUserData = localEncrypted || sessionEncrypted;
    if (!encryptedUserData) {
      console.debug("🔍 No encrypted user data found");
      return null;
    }

    // Decrypt and parse user data
    const decryptedData = decryptData(encryptedUserData);
    const userData = JSON.parse(decryptedData);

    console.debug("✅ Secure user data retrieved");
    return userData;
  } catch (error) {
    console.error("❌ Failed to retrieve secure user data:", error);
    return null;
  }
};

/**
 * Checks if user has secure authentication credentials
 */
export const secureHasAuthCredentials = (): boolean => {
  const accessToken = secureGetAuthToken();
  const refreshToken = secureGetRefreshToken();

  console.debug("🔍 Secure auth credentials check:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    timestamp: new Date().toISOString(),
  });

  return !!(accessToken || refreshToken);
};

/**
 * Validates current authentication with comprehensive security checks
 */
export const secureValidateAuth = (): boolean => {
  try {
    const accessToken = secureGetAuthToken();
    if (!accessToken) {
      console.debug("❌ No access token available");
      return false;
    }

    // Validate session fingerprint from storage
    const localFingerprint = localStorage.getItem("sessionFingerprint");
    const sessionFingerprint = sessionStorage.getItem("sessionFingerprint");
    const storedFingerprint = localFingerprint || sessionFingerprint;

    if (!storedFingerprint) {
      console.warn("⚠️ No session fingerprint found");
      return false;
    }

    if (!validateSessionFingerprint(storedFingerprint)) {
      console.warn("⚠️ Session fingerprint validation failed");
      secureLogout();
      return false;
    }

    console.debug("✅ Secure authentication validation passed");
    return true;
  } catch (error) {
    console.error("❌ Secure auth validation failed:", error);
    secureLogout();
    return false;
  }
};

/**
 * Securely logs out user and clears all sensitive data
 */
export const secureLogout = (clearRememberedEmail: boolean = false): void => {
  console.debug("🚪 Starting secure logout...");

  // Don't call getter functions to avoid infinite recursion during error handling
  // Clear encrypted data from both storages directly
  const itemsToRemove = [
    "secureAuthToken",
    "secureRefreshToken",
    "secureUserData",
    "sessionFingerprint",
    "csrfToken",
    "rememberMe",
  ];

  itemsToRemove.forEach((item) => {
    localStorage.removeItem(item);
    sessionStorage.removeItem(item);
  });

  // Also clear any legacy tokens that might exist
  const legacyItems = ["authToken", "refreshToken", "user"];

  legacyItems.forEach((item) => {
    localStorage.removeItem(item);
    sessionStorage.removeItem(item);
  });
  // Optionally clear remembered email
  if (clearRememberedEmail) {
    localStorage.removeItem("rememberedEmail");
  }

  console.log("🧹 Secure logout completed - all sensitive data cleared");

  // Dispatch logout event
  window.dispatchEvent(new CustomEvent("authLogout"));
};

/**
 * Sanitizes user input for authentication forms
 */
export const sanitizeAuthInput = (
  input: string,
  field: "email" | "password" | "username"
): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Basic sanitization
  let sanitized = sanitizeInput(input.trim());

  // Field-specific validation
  switch (field) {
    case "email":
      // Remove any non-email characters but preserve email format
      sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, "");
      break;
    case "username":
      // Allow alphanumeric, underscore, hyphen
      sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "");
      break;
    case "password":
      // For passwords, we only sanitize for XSS but preserve special characters
      // The original input sanitization should be sufficient
      break;
  }

  if (sanitized !== input) {
    console.warn(
      `⚠️ Input for ${field} contained potentially malicious content and was sanitized`
    );
  }

  return sanitized;
};

/**
 * Gets the current storage type for secure tokens
 */
export const secureGetCurrentStorageType = ():
  | "localStorage"
  | "sessionStorage"
  | null => {
  if (
    localStorage.getItem("secureAuthToken") ||
    localStorage.getItem("secureRefreshToken")
  ) {
    return "localStorage";
  }
  if (
    sessionStorage.getItem("secureAuthToken") ||
    sessionStorage.getItem("secureRefreshToken")
  ) {
    return "sessionStorage";
  }
  return null;
};

/**
 * Gets remember me preference with security validation
 */
export const secureGetRememberMePreference = (): boolean => {
  const currentStorageType = secureGetCurrentStorageType();

  if (currentStorageType === "localStorage") {
    return localStorage.getItem("rememberMe") === "true";
  }

  if (currentStorageType === "sessionStorage") {
    return sessionStorage.getItem("rememberMe") === "true";
  }

  // Check for remembered email as fallback
  const hasRememberedEmail = !!localStorage.getItem("rememberedEmail");

  console.debug("🔍 Secure remember me preference check:", {
    currentStorageType,
    hasRememberedEmail,
  });

  return hasRememberedEmail;
};

/**
 * Migration function to upgrade existing tokens to secure storage
 */
export const migrateToSecureTokens = (): boolean => {
  console.debug("🔄 Checking for legacy tokens to migrate...");

  try {
    // Check for existing legacy tokens
    const legacyAccessToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const legacyRefreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");
    const legacyUserData =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const legacyRememberMe = localStorage.getItem("rememberMe") === "true";

    if (!legacyAccessToken && !legacyRefreshToken) {
      console.debug("✅ No legacy tokens found to migrate");
      return false;
    }

    console.debug("🔄 Migrating legacy tokens to secure storage...");

    // Parse user data
    let userData = {};
    if (legacyUserData) {
      try {
        userData = JSON.parse(legacyUserData);
      } catch {
        console.warn("⚠️ Failed to parse legacy user data");
      }
    } // Store tokens securely (skip logout during migration to prevent unwanted logout)
    if (legacyAccessToken && legacyRefreshToken) {
      secureStoreAuthTokens(
        legacyAccessToken,
        legacyRefreshToken,
        userData,
        legacyRememberMe,
        true // Skip logout during migration
      );
    }

    // Clear legacy tokens
    // const legacyItems = ["authToken", "refreshToken", "user", "rememberMe"];
    const legacyItems = ["authToken", "refreshToken", "user"];
    legacyItems.forEach((item) => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });

    console.log("✅ Legacy tokens migrated to secure storage successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to migrate legacy tokens:", error);
    return false;
  }
};

export default {
  secureStoreAuthTokens,
  secureGetAuthToken,
  secureGetRefreshToken,
  secureGetUserData,
  secureHasAuthCredentials,
  secureValidateAuth,
  secureLogout,
  sanitizeAuthInput,
  secureGetCurrentStorageType,
  secureGetRememberMePreference,
  migrateToSecureTokens,
};
