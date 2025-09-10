// src/config.ts
// let backendUrl = "http://192.168.74.14:3000";
let backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
if (
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_BACKEND_DOMAIN
) {
  backendUrl = process.env.REACT_APP_BACKEND_DOMAIN;
}
export const BACKEND_BASE_URL = backendUrl;
