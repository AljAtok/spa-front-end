# 🚨 Infinite Redirect Debug Script

## Issue Status: INVESTIGATING

The user reported that the infinite redirect loop is still occurring when browser is reopened after login without "Remember Me" checked. Even though previous documentation indicates this was fixed, we need to identify the current root cause.

## 🔍 Debug Script to Run in Browser Console

### Step 1: Check Current Authentication State

```javascript
// Run this in browser console (F12 → Console)
console.log("=== AUTHENTICATION DEBUG ===");
console.log("Current URL:", window.location.href);
console.log("Current Path:", window.location.pathname);

// Check storage contents
console.log("localStorage contents:", {
  authToken: localStorage.getItem("authToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: localStorage.getItem("user"),
  rememberMe: localStorage.getItem("rememberMe"),
  rememberedEmail: localStorage.getItem("rememberedEmail"),
});

console.log("sessionStorage contents:", {
  authToken: sessionStorage.getItem("authToken"),
  refreshToken: sessionStorage.getItem("refreshToken"),
  user: sessionStorage.getItem("user"),
  rememberMe: sessionStorage.getItem("rememberMe"),
});

// Check auth functions (if available globally)
if (window.hasAuthCredentials) {
  console.log("hasAuthCredentials():", window.hasAuthCredentials());
} else {
  console.log("hasAuthCredentials function not available globally");
}
```

### Step 2: Monitor Route Changes

```javascript
// Track navigation events
let navigationCount = 0;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function (...args) {
  navigationCount++;
  console.log(`🔄 Navigation ${navigationCount}: pushState to`, args[2]);
  return originalPushState.apply(history, args);
};

history.replaceState = function (...args) {
  navigationCount++;
  console.log(`🔄 Navigation ${navigationCount}: replaceState to`, args[2]);
  return originalReplaceState.apply(history, args);
};

// Also monitor popstate
window.addEventListener("popstate", () => {
  navigationCount++;
  console.log(
    `🔄 Navigation ${navigationCount}: popstate to`,
    window.location.pathname
  );
});

console.log(
  "Navigation monitoring enabled. Watch for rapid navigation events."
);
```

### Step 3: Check for Multiple Auth Checks

```javascript
// Monitor console for auth-related messages
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;

console.log = function (...args) {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    (args[0].includes("auth") ||
      args[0].includes("🔍") ||
      args[0].includes("🔄"))
  ) {
    originalConsoleLog.apply(console, ["[AUTH]", ...args]);
  } else {
    originalConsoleLog.apply(console, args);
  }
};

console.debug = function (...args) {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    (args[0].includes("auth") ||
      args[0].includes("🔍") ||
      args[0].includes("🔄"))
  ) {
    originalConsoleLog.apply(console, ["[AUTH-DEBUG]", ...args]);
  } else {
    originalConsoleDebug.apply(console, args);
  }
};

console.log("Auth logging monitoring enabled.");
```

## 🧪 Test Scenarios to Reproduce Issue

### Scenario 1: Fresh Browser Session (Most Likely Issue)

1. **Login without Remember Me**
2. **Close browser completely**
3. **Open browser and navigate to app**
4. **Run debug script above**
5. **Look for:**
   - Empty sessionStorage (expected)
   - Rapid navigation between /login and /dashboard
   - Multiple auth checks running simultaneously

### Scenario 2: Token Expiration

1. **Login without Remember Me**
2. **Manually expire tokens** (modify in storage or wait)
3. **Navigate to protected route**
4. **Run debug script**
5. **Look for:**
   - Expired tokens in sessionStorage
   - hasAuthCredentials() returning true for expired tokens
   - API calls failing but navigation continuing

## 🎯 Expected Findings

### If Issue Still Exists:

1. **Multiple Auth Checks**: App.tsx and another component doing different auth checks
2. **Expired Token Logic**: hasAuthCredentials() returning true for expired tokens
3. **Race Conditions**: Multiple useEffect hooks running simultaneously
4. **Storage Conflicts**: Something writing to storage unexpectedly

### If Issue Is Fixed:

1. **Clean Storage**: Only localStorage.rememberedEmail exists
2. **Single Redirect**: One redirect to /login, no loops
3. **Consistent Auth**: All auth checks return false
4. **No Navigation Spam**: Maximum 1-2 navigation events

## 🔧 Emergency Fixes (If Issue Persists)

### Fix 1: Add Navigation Debouncing

```javascript
// Add to App.tsx useEffect
let navigating = false;
const checkAuth = () => {
  if (navigating) return;
  navigating = true;

  // ... existing auth logic ...

  setTimeout(() => {
    navigating = false;
  }, 500);
};
```

### Fix 2: Clear All Storage on Restart

```javascript
// Add to auth.ts
export const clearExpiredSessionStorage = () => {
  if (!localStorage.getItem("rememberMe")) {
    sessionStorage.clear();
  }
};
```

### Fix 3: Force Single Auth Source

```javascript
// Modify hasAuthCredentials to be more strict
export const hasAuthCredentials = (): boolean => {
  const refreshToken = getRefreshToken();
  // Only return true if we have a refresh token
  return !!refreshToken;
};
```

## 📋 Next Steps

1. **Run debug script** in affected browser
2. **Capture console output** during redirect loop
3. **Identify exact sequence** of auth checks and navigation
4. **Apply targeted fix** based on findings
5. **Verify fix** with comprehensive testing

## 🚨 Critical Questions to Answer

1. **Is hasAuthCredentials() returning true when it should return false?**
2. **Are there multiple useEffect hooks triggering auth checks?**
3. **Is something restoring tokens to sessionStorage unexpectedly?**
4. **Are expired tokens being treated as valid credentials?**

The debug script above will help identify the exact cause and guide us to the right fix.
