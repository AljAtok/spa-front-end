// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { hasAuthCredentials } from "../utils/auth"; // Import the more lenient auth check

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const hasCredentials = hasAuthCredentials();

  console.debug("🔒 ProtectedRoute check:", {
    hasCredentials,
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString(),
  });

  if (!hasCredentials) {
    console.debug("🔒 ProtectedRoute: No credentials, redirecting to login");
    // User has no auth credentials (no access token AND no refresh token), redirect to login
    return <Navigate to="/login" replace />;
  }

  console.debug("🔒 ProtectedRoute: Credentials found, allowing access");
  return <>{children}</>; // User has credentials, render the children (axios interceptor will handle token refresh if needed)
};

export default ProtectedRoute;
