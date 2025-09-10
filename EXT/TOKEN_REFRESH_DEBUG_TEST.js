// Test script to debug token refresh issues
// Run this in browser console to test token refresh flow

console.log("🧪 Starting Token Refresh Debug Test...");

// Function to check current token status
function checkTokenStatus() {
  const authToken =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const refreshToken =
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken");

  console.log("📊 Current Token Status:", {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    authTokenPreview: authToken ? authToken.substring(0, 30) + "..." : "none",
    refreshTokenPreview: refreshToken
      ? refreshToken.substring(0, 30) + "..."
      : "none",
    timestamp: new Date().toISOString(),
  });

  return { authToken, refreshToken };
}

// Function to manually trigger token refresh
async function triggerTokenRefresh() {
  console.log("🔄 Manually triggering token refresh...");

  const refreshToken =
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.error("❌ No refresh token available");
    return null;
  }

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
      console.log("✅ Manual token refresh successful:", {
        hasNewAccessToken: !!data.access_token,
        hasNewRefreshToken: !!data.refresh_token,
        newTokenPreview: data.access_token
          ? data.access_token.substring(0, 30) + "..."
          : "none",
      });
      return data;
    } else {
      console.error(
        "❌ Manual token refresh failed:",
        response.status,
        response.statusText
      );
      return null;
    }
  } catch (error) {
    console.error("❌ Manual token refresh error:", error);
    return null;
  }
}

// Function to test API call with current token
async function testApiCall(endpoint = "/users/nested/3") {
  console.log(`🔍 Testing API call to ${endpoint}...`);

  const authToken =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  if (!authToken) {
    console.error("❌ No auth token available for test");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer_c+gi ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📡 API call result:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      endpoint: endpoint,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API call successful, data received:", !!data);
    } else {
      console.error("❌ API call failed");
    }

    return response;
  } catch (error) {
    console.error("❌ API call error:", error);
    return null;
  }
}

// Function to run complete test sequence
async function runCompleteTest() {
  console.log("🚀 Running complete token refresh test sequence...");

  // Step 1: Check initial token status
  console.log("\n1️⃣ Checking initial token status...");
  checkTokenStatus();

  // Step 2: Test API call with current token
  console.log("\n2️⃣ Testing API call with current token...");
  const apiResult1 = await testApiCall();

  if (apiResult1 && apiResult1.ok) {
    console.log("✅ Initial API call successful - no refresh needed");
    return;
  }

  // Step 3: Manually refresh token
  console.log("\n3️⃣ Manually refreshing token...");
  const refreshResult = await triggerTokenRefresh();

  if (!refreshResult) {
    console.error("❌ Manual token refresh failed - stopping test");
    return;
  }

  // Step 4: Store new tokens
  console.log("\n4️⃣ Storing new tokens...");
  const rememberMe = localStorage.getItem("authToken") !== null;
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("authToken", refreshResult.access_token);
  if (refreshResult.refresh_token) {
    storage.setItem("refreshToken", refreshResult.refresh_token);
  }

  console.log(
    `💾 New tokens stored in ${rememberMe ? "localStorage" : "sessionStorage"}`
  );

  // Step 5: Check token status after refresh
  console.log("\n5️⃣ Checking token status after refresh...");
  checkTokenStatus();

  // Step 6: Test API call with new token
  console.log("\n6️⃣ Testing API call with new token...");
  const apiResult2 = await testApiCall();

  if (apiResult2 && apiResult2.ok) {
    console.log("✅ API call successful with new token!");
  } else {
    console.error(
      "❌ API call still failing with new token - deeper investigation needed"
    );

    // Additional debugging
    console.log("\n🔍 Additional debugging info:");
    const currentToken = storage.getItem("authToken");
    console.log(
      "Current stored token preview:",
      currentToken ? currentToken.substring(0, 50) + "..." : "none"
    );
    console.log(
      "Token format check:",
      currentToken
        ? {
            length: currentToken.length,
            startsWith: currentToken.substring(0, 10),
            containsDots: currentToken.includes("."),
            partsCount: currentToken.split(".").length,
          }
        : "no token"
    );
  }

  console.log("\n🏁 Test sequence completed");
}

// Function to check axios instance configuration
function checkAxiosConfig() {
  console.log("⚙️ Checking axios configuration...");

  // Try to access the axios instance from window if available
  if (window.axios) {
    console.log("Axios defaults:", {
      baseURL: window.axios.defaults.baseURL,
      authHeader: window.axios.defaults.headers.common.Authorization,
      timeout: window.axios.defaults.timeout,
    });
  } else {
    console.log("❌ Axios not accessible from window");
  }
}

// Export functions for manual use
window.tokenDebugTest = {
  checkTokenStatus,
  triggerTokenRefresh,
  testApiCall,
  runCompleteTest,
  checkAxiosConfig,
};

console.log("🧪 Token refresh debug test loaded!");
console.log("📋 Available functions:");
console.log("- tokenDebugTest.checkTokenStatus()");
console.log("- tokenDebugTest.triggerTokenRefresh()");
console.log("- tokenDebugTest.testApiCall()");
console.log("- tokenDebugTest.runCompleteTest()");
console.log("- tokenDebugTest.checkAxiosConfig()");
console.log("\n🚀 Run tokenDebugTest.runCompleteTest() to start the full test");
