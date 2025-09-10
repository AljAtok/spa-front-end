// Debug utility for authentication loop issue
// src/debug/authDebug.js

/**
 * Debug script to test and monitor authentication flow
 * Can be run in browser console to monitor auth behavior
 */

window.authDebug = {
  // Monitor localStorage changes
  monitorStorage: () => {
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
      if (
        key.includes("auth") ||
        key.includes("token") ||
        key.includes("user")
      ) {
        console.log(
          `🔍 localStorage.setItem: ${key} = ${value?.substring(0, 50)}...`
        );
      }
      return originalSetItem.apply(this, arguments);
    };

    Storage.prototype.removeItem = function (key) {
      if (
        key.includes("auth") ||
        key.includes("token") ||
        key.includes("user")
      ) {
        console.log(`🔍 localStorage.removeItem: ${key}`);
      }
      return originalRemoveItem.apply(this, arguments);
    };

    console.log("📊 Storage monitoring enabled");
  },

  // Check current auth state
  checkAuthState: () => {
    const authKeys = [
      "authToken",
      "refreshToken",
      "user",
      "rememberMe",
      "secureAuthToken",
      "secureRefreshToken",
      "secureUserData",
      "sessionFingerprint",
      "csrfToken",
      "rememberedEmail",
    ];

    console.log("🔍 Current Auth State:");
    authKeys.forEach((key) => {
      const localValue = localStorage.getItem(key);
      const sessionValue = sessionStorage.getItem(key);

      if (localValue || sessionValue) {
        console.log(`${key}:`);
        if (localValue)
          console.log(`  localStorage: ${localValue.substring(0, 50)}...`);
        if (sessionValue)
          console.log(`  sessionStorage: ${sessionValue.substring(0, 50)}...`);
      }
    });
  },

  // Clear all auth data manually
  clearAllAuth: () => {
    const authKeys = [
      "authToken",
      "refreshToken",
      "user",
      "rememberMe",
      "secureAuthToken",
      "secureRefreshToken",
      "secureUserData",
      "sessionFingerprint",
      "csrfToken",
      "rememberedEmail",
    ];

    authKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    console.log("🧹 All auth data cleared manually");

    // Trigger logout event
    window.dispatchEvent(new CustomEvent("authLogout"));
  },

  // Monitor axios requests
  monitorRequests: () => {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const url = args[0];
      if (
        typeof url === "string" &&
        (url.includes("auth") || url.includes("logout"))
      ) {
        console.log(`🌐 Fetch request: ${url}`);
      }
      return originalFetch.apply(this, arguments);
    };

    console.log("📊 Request monitoring enabled");
  },

  // Test login with invalid credentials
  testInvalidLogin: async (email = "test@test.com", password = "wrong") => {
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log(`🔍 Login test result: ${response.status}`);
      const data = await response.text();
      console.log(`🔍 Response: ${data}`);
    } catch (error) {
      console.log(`🔍 Login test error:`, error);
    }
  },

  // Reset logout flag
  resetLogoutFlag: () => {
    if (window.resetLogoutFlag) {
      window.resetLogoutFlag();
      console.log("🔄 Logout flag reset");
    } else {
      console.log("❌ resetLogoutFlag not available");
    }
  },
};

console.log(
  "🐛 Auth Debug utilities loaded. Use window.authDebug to access functions."
);
console.log("Available functions:");
console.log("  - monitorStorage(): Monitor localStorage changes");
console.log("  - checkAuthState(): Check current authentication state");
console.log("  - clearAllAuth(): Clear all auth data manually");
console.log("  - monitorRequests(): Monitor fetch requests");
console.log("  - testInvalidLogin(): Test login with invalid credentials");
console.log("  - resetLogoutFlag(): Reset the logout flag");
