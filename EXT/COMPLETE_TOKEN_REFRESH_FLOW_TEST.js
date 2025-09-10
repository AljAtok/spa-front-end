// Complete Token Refresh Flow Verification
// This script tests the entire token refresh mechanism

const tokenRefreshFlowTest = {
  // Test 1: Verify token storage consistency
  async testTokenStorageConsistency() {
    console.log("🔍 ===== TOKEN STORAGE CONSISTENCY TEST =====");

    const regularToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    console.log("📋 Regular storage token exists:", !!regularToken);

    // Check if secure storage functions are available
    const hasSecureStorage = typeof window.secureGetAuthToken === "function";
    console.log("🔐 Secure storage available:", hasSecureStorage);

    if (hasSecureStorage) {
      try {
        const secureToken = window.secureGetAuthToken();
        console.log("🔐 Secure storage token exists:", !!secureToken);

        if (regularToken && secureToken) {
          console.log("✅ Both storage types have tokens");
        } else if (regularToken && !secureToken) {
          console.log("⚠️ Only regular storage has token");
        } else if (!regularToken && secureToken) {
          console.log("⚠️ Only secure storage has token");
        } else {
          console.log("❌ No tokens found in either storage");
        }
      } catch (error) {
        console.error("❌ Secure storage error:", error);
      }
    }
  },

  // Test 2: Verify getAccessToken function
  async testGetAccessToken() {
    console.log("🔍 ===== GET ACCESS TOKEN TEST =====");

    try {
      // Test if getAccessToken is available globally
      if (typeof window.getAccessToken === "function") {
        const token = window.getAccessToken();
        console.log(
          "🎯 getAccessToken result:",
          token ? "Token found" : "No token"
        );
        if (token) {
          console.log("🎯 Token preview:", token.substring(0, 20) + "...");
        }
      } else {
        console.log("⚠️ getAccessToken not available globally");
      }
    } catch (error) {
      console.error("❌ getAccessToken error:", error);
    }
  },

  // Test 3: Simulate token refresh request
  async testTokenRefreshEndpoint() {
    console.log("🔍 ===== TOKEN REFRESH ENDPOINT TEST =====");

    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");

    if (!refreshToken) {
      console.error("❌ No refresh token found - cannot test refresh endpoint");
      return false;
    }

    console.log("🔄 Testing refresh endpoint with existing refresh token...");

    try {
      const response = await fetch("/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      console.log("📡 Refresh response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Refresh endpoint working:", {
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token,
        });
        return data;
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Refresh endpoint failed:",
          response.status,
          errorText
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Refresh endpoint error:", error);
      return false;
    }
  },

  // Test 4: Test API request with token
  async testAPIRequestWithToken() {
    console.log("🔍 ===== API REQUEST WITH TOKEN TEST =====");

    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!token) {
      console.error("❌ No token found - cannot test API request");
      return;
    }

    try {
      const response = await fetch("/users/nested/3", {
        headers: {
          Authorization: `Bearer_c+gi ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 API request status:", response.status);

      if (response.ok) {
        console.log("✅ API request successful with current token");
      } else if (response.status === 401) {
        console.log(
          "🔄 Token expired (401) - this will trigger refresh interceptor"
        );
      } else {
        console.error("❌ API request failed:", response.status);
      }
    } catch (error) {
      console.error("❌ API request error:", error);
    }
  },

  // Test 5: Complete flow test
  async testCompleteFlow() {
    console.log("🧪 ===== COMPLETE TOKEN REFRESH FLOW TEST =====");
    console.log("Starting comprehensive token refresh flow verification...");

    await this.testTokenStorageConsistency();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await this.testGetAccessToken();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const refreshResult = await this.testTokenRefreshEndpoint();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await this.testAPIRequestWithToken();

    console.log("🎯 ===== FLOW TEST COMPLETE =====");

    if (refreshResult) {
      console.log("✅ Token refresh mechanism appears to be working correctly");
      console.log(
        "💡 If you still see 'Unable to Load User Permissions', check:"
      );
      console.log("   1. Backend is running and accessible");
      console.log("   2. User permissions endpoint is working");
      console.log(
        "   3. Token format matches backend expectations (Bearer_c+gi)"
      );
    } else {
      console.log("❌ Token refresh mechanism needs attention");
    }
  },

  // Test 6: Check axios interceptor status
  checkAxiosInterceptor() {
    console.log("🔍 ===== AXIOS INTERCEPTOR STATUS =====");

    // Check if axios is available
    if (typeof window.axios !== "undefined") {
      const requestInterceptors =
        window.axios.defaults.interceptors?.request?.handlers?.length || 0;
      const responseInterceptors =
        window.axios.defaults.interceptors?.response?.handlers?.length || 0;

      console.log("📡 Request interceptors:", requestInterceptors);
      console.log("📡 Response interceptors:", responseInterceptors);

      if (responseInterceptors > 0) {
        console.log(
          "✅ Response interceptor is registered (token refresh should work)"
        );
      } else {
        console.log("⚠️ No response interceptors found");
      }
    } else {
      console.log("⚠️ Axios not available globally");
    }
  },
};

// Make available globally
window.tokenRefreshFlowTest = tokenRefreshFlowTest;

console.log("🧪 Token Refresh Flow Test Ready!");
console.log("Commands available:");
console.log("  tokenRefreshFlowTest.testCompleteFlow() - Run all tests");
console.log(
  "  tokenRefreshFlowTest.testTokenStorageConsistency() - Test storage"
);
console.log(
  "  tokenRefreshFlowTest.testTokenRefreshEndpoint() - Test refresh API"
);
console.log(
  "  tokenRefreshFlowTest.checkAxiosInterceptor() - Check interceptor status"
);
