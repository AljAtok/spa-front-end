// Token Refresh Debug Test - Updated for Bearer_c+gi
// Run this in browser console to test the token refresh mechanism

const tokenRefreshDebugTest = {
  async testTokenRetrieval() {
    console.log("🔍 ===== TOKEN RETRIEVAL TEST =====");

    // Test regular storage
    const regularToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    console.log(
      "📋 Regular storage token:",
      regularToken ? regularToken.substring(0, 20) + "..." : "null"
    );

    // Test secure storage
    try {
      const secureToken = window.secureGetAuthToken
        ? window.secureGetAuthToken()
        : "secureGetAuthToken not available";
      console.log(
        "🔐 Secure storage token:",
        secureToken ? secureToken.substring(0, 20) + "..." : "null"
      );
    } catch (error) {
      console.log("❌ Secure storage error:", error);
    }

    // Test getAccessToken function
    try {
      const accessToken = window.getAccessToken
        ? window.getAccessToken()
        : "getAccessToken not available";
      console.log(
        "🎯 getAccessToken result:",
        accessToken ? accessToken.substring(0, 20) + "..." : "null"
      );
    } catch (error) {
      console.log("❌ getAccessToken error:", error);
    }
  },

  async testManualRefresh() {
    console.log("🔍 ===== MANUAL REFRESH TEST =====");

    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.error("❌ No refresh token found");
      return;
    }

    console.log("🔄 Testing manual token refresh...");

    try {
      const response = await fetch("http://localhost:3000/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Manual refresh successful:", {
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token,
          accessTokenPreview: data.access_token
            ? data.access_token.substring(0, 20) + "..."
            : "null",
        });

        // Test the new token with a request
        await this.testNewToken(data.access_token);
      } else {
        console.error(
          "❌ Manual refresh failed:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ Manual refresh error:", error);
    }
  },

  async testNewToken(token) {
    console.log("🔍 ===== NEW TOKEN TEST =====");

    try {
      const response = await fetch("http://localhost:3000/users/nested/3", {
        headers: {
          Authorization: `Bearer_c+gi ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("✅ New token works correctly!");
      } else {
        console.error(
          "❌ New token rejected:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ New token test error:", error);
    }
  },

  async testFullFlow() {
    console.log("🔍 ===== FULL TOKEN REFRESH FLOW TEST =====");

    await this.testTokenRetrieval();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.testManualRefresh();
  },
};

// Make it available globally
window.tokenRefreshDebugTest = tokenRefreshDebugTest;

console.log("🧪 Token Refresh Debug Test Ready!");
console.log("Run: tokenRefreshDebugTest.testFullFlow()");
