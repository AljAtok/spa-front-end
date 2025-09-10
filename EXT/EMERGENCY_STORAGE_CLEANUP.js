// Emergency Storage Cleanup Script
// Run this in the browser console to clear all authentication data

console.log("🧹 Starting emergency storage cleanup...");

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
  "rememberedEmail",
];

// Clear from both localStorage and sessionStorage
itemsToRemove.forEach((item) => {
  localStorage.removeItem(item);
  sessionStorage.removeItem(item);
  console.log(`Removed: ${item}`);
});

// Clear any other items that might be related
Object.keys(localStorage).forEach((key) => {
  if (
    key.toLowerCase().includes("auth") ||
    key.toLowerCase().includes("token") ||
    key.toLowerCase().includes("user") ||
    key.toLowerCase().includes("secure")
  ) {
    localStorage.removeItem(key);
    console.log(`Removed from localStorage: ${key}`);
  }
});

Object.keys(sessionStorage).forEach((key) => {
  if (
    key.toLowerCase().includes("auth") ||
    key.toLowerCase().includes("token") ||
    key.toLowerCase().includes("user") ||
    key.toLowerCase().includes("secure")
  ) {
    sessionStorage.removeItem(key);
    console.log(`Removed from sessionStorage: ${key}`);
  }
});

console.log("✅ Emergency storage cleanup completed!");
console.log("Please refresh the page to restart the application.");
