// src/utils/authSafetyCheck.ts
// Safety utilities to prevent infinite loops in authentication

let isAuthCleanupInProgress = false;
let authFailureCount = 0;
const MAX_AUTH_FAILURES = 3;

/**
 * Safe authentication check that prevents infinite loops
 */
export const safeHasAuthCredentials = (): boolean => {
  // If cleanup is in progress, return false immediately
  if (isAuthCleanupInProgress) {
    console.debug("🔒 Auth cleanup in progress, returning false");
    return false;
  }

  // If we've had too many failures, assume no auth and reset
  if (authFailureCount >= MAX_AUTH_FAILURES) {
    console.warn(
      `⚠️ Too many auth failures (${authFailureCount}), assuming no credentials`
    );
    return false;
  }

  // Check for any tokens in storage directly (without decryption)
  try {
    const hasSecureTokens = !!(
      localStorage.getItem("secureAuthToken") ||
      sessionStorage.getItem("secureAuthToken") ||
      localStorage.getItem("secureRefreshToken") ||
      sessionStorage.getItem("secureRefreshToken")
    );

    const hasLegacyTokens = !!(
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken")
    );

    const hasCredentials = hasSecureTokens || hasLegacyTokens;

    console.debug("🔍 Safe auth check result:", {
      hasSecureTokens,
      hasLegacyTokens,
      hasCredentials,
      authFailureCount,
    });

    return hasCredentials;
  } catch (error) {
    console.error("❌ Safe auth check failed:", error);
    authFailureCount++;
    return false;
  }
};

/**
 * Safely clears all authentication data without triggering loops
 */
export const safeAuthCleanup = (): void => {
  if (isAuthCleanupInProgress) {
    console.debug("🔒 Auth cleanup already in progress, skipping");
    return;
  }

  isAuthCleanupInProgress = true;
  console.debug("🧹 Starting safe auth cleanup...");

  try {
    // Clear all possible authentication-related items
    const itemsToRemove = [
      "secureAuthToken",
      "secureRefreshToken",
      "secureUserData",
      "sessionFingerprint",
      "csrfToken",
      "rememberMe",
      "authToken",
      "refreshToken",
      "user",
    ];

    // Clear from both localStorage and sessionStorage
    itemsToRemove.forEach((item) => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });

    // Reset failure count
    authFailureCount = 0;

    console.log("✅ Safe auth cleanup completed");
  } catch (error) {
    console.error("❌ Safe auth cleanup failed:", error);
  } finally {
    isAuthCleanupInProgress = false;
  }
};

/**
 * Reset auth failure counter
 */
export const resetAuthFailureCount = (): void => {
  authFailureCount = 0;
};

/**
 * Get current auth failure count
 */
export const getAuthFailureCount = (): number => {
  return authFailureCount;
};
