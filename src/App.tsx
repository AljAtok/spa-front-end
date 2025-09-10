// src/App.tsx
import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Topbar from "./pages/global/Topbar/Topbar";
import Sidebar from "./pages/global/Sidebar/Sidebar";
// import Dashboard from "./pages/dashboard/Dashboard";
import { CssBaseline, ThemeProvider, Box, useMediaQuery } from "@mui/material";
import { ColorModeContext, useMode } from "./hooks/useMode";
import LoginPage from "./pages/Auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { SnackbarProvider } from "notistack";
import { hasAuthCredentials, cleanupStaleSession } from "./utils/auth";
import { SecurityProvider } from "./contexts/SecurityContext";
import SecurityAlert from "./components/SecurityAlert";
import RolesManagement from "./pages/RoleManagement/RoleManagement";
import RoleForm from "./pages/RoleManagement/RoleForm";
import ModuleManagement from "./pages/ModuleManagement/ModuleManagement";
import ModuleForm from "./pages/ModuleManagement/ModuleForm";
import LocationManagement from "./pages/LocationManagement/LocationManagement";
import LocationForm from "./pages/LocationManagement/LocationForm";
import LocationTypeManagement from "./pages/LocationTypeManagement/LocationTypeManagement";
import LocationTypeForm from "./pages/LocationTypeManagement/LocationTypeForm";
import RolePresetsManagement from "./pages/RolePresetsManagement/RolePresetsManagement";
import RolePresetForm from "./pages/RolePresetsManagement/RolePresetForm";
import CompanyManagement from "./pages/CompanyManagement/CompanyManagement";
import CompanyForm from "./pages/CompanyManagement/CompanyForm";
import AccessKeyManagement from "./pages/AccessKeyManagement/AccessKeyManagement";
import AccessKeyForm from "./pages/AccessKeyManagement/AccessKeyForm";
import NotAuthorized from "./pages/NotAuthorized/NotAuthorized";
import UserManagement from "./pages/UserManagement/UserManagement";
import UserForm from "./pages/UserManagement/UserForm";
import { UserPermissionsProvider } from "./contexts/UserPermissionsContext";
import PageLoader from "./components/PageLoader";
import RegionManagement from "./pages/RegionManagement/RegionManagement";
import RegionForm from "./pages/RegionManagement/RegionForm";
import TakeOutStoreManagement from "./pages/TakeOutStoreManagement";
import PositionManagement from "./pages/PositionManagement/PositionManagement";
import PositionForm from "./pages/PositionManagement/PositionForm";
import EmployeeManagement from "./pages/EmployeeManagement/EmployeeManagement";
import EmployeeForm from "./pages/EmployeeManagement/EmployeeForm";
import StoreEmployeeManagement from "./pages/StoreEmployeeManagement/StoreEmployeeManagement";
import StoreEmployeeForm from "./pages/StoreEmployeeManagement/StoreEmployeeForm";
import StoreEmployeeUploadPage from "./pages/StoreEmployeeManagement/StoreEmployeeUploadPage";
import TransactionManagement from "./pages/TransactionManagement/TransactionManagement";
import TransactionForm from "./pages/TransactionManagement/TransactionForm";
import TransactionView from "./pages/TransactionManagement/TransactionView";
import IncentiveTransReport from "./pages/IncentiveTransReport/IncentiveTransReport";
import IncentiveTransDashboard from "./pages/IncentiveTransDashboard/IncentiveTransDashboard";
import AuditTrailManagement from "./pages/AuditTrailManagement/AuditTrailManagement";
import AuditTrailDetail from "./pages/AuditTrailManagement/AuditTrailDetail";
import StoreHurdleManagement from "./pages/StoreHurdleManagement/StoreHurdleManagement";
import StoreHurdleForm from "./pages/StoreHurdleManagement/StoreHurdleForm";
import StoreHurdleUploadPage from "./pages/StoreHurdleManagement/StoreHurdleUploadPage";
import StoreRateManagement from "./pages/StoreRateManagement/StoreRateManagement";
import StoreRateForm from "./pages/StoreRateManagement/StoreRateForm";
import StoreRateUploadPage from "./pages/StoreRateManagement/StoreRateUploadPage";
import MUILocalizationProvider from "@/components/MUILocalizationProvider";
import SalesTransactionsListing from "./pages/SalesTransactionsListing";
import SalesTransactionView from "./pages/SalesTransactionView";
import SalesBudgetTransactionsListing from "./pages/SalesBudgetTransactionsListing";
import SalesBudgetTransactionView from "./pages/SalesBudgetTransactionView";
import SalesBudgetTransactionUploadPage from "./pages/SalesBudgetTransactionUploadPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import TempPasswordChange from "./pages/TempPasswordChange/TempPasswordChange";
import UserUploadingPage from "./pages/UserManagement/UserUploadingPage";
import EmployeeUploadPage from "./pages/EmployeeManagement/EmployeeUploadPage";

function App() {
  const [theme, colorMode] = useMode();
  const isNonMobile = useMediaQuery(theme.breakpoints.up("md"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(isNonMobile);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation guard to prevent infinite redirects
  const lastNavigationRef = useRef<{ path: string; timestamp: number } | null>(
    null
  );
  const navigationCountRef = useRef(0);

  // One-time cleanup on app startup
  useEffect(() => {
    cleanupStaleSession();
  }, []); // Run only once when app starts

  useEffect(() => {
    setIsSidebarOpen(isNonMobile);
  }, [isNonMobile]);

  // --- Authentication Check (Updated for dual storage support) ---
  useEffect(() => {
    const checkAuth = () => {
      const hasCredentials = hasAuthCredentials();

      console.log("🔍 App.tsx auth check:", {
        hasCredentials,
        currentPath: location.pathname,
        timestamp: new Date().toISOString(),
      });

      // Navigation guard: prevent rapid redirects
      const now = Date.now();
      const currentPath = location.pathname;

      if (lastNavigationRef.current) {
        const timeDiff = now - lastNavigationRef.current.timestamp;
        const samePath = lastNavigationRef.current.path === currentPath;

        // If we're trying to navigate to the same path within 1 second, abort
        if (samePath && timeDiff < 1000) {
          navigationCountRef.current++;
          console.warn(
            `⚠️ Rapid navigation detected (${navigationCountRef.current}x) - preventing potential infinite loop`
          );

          // If we've had more than 3 rapid navigation attempts, force stop
          if (navigationCountRef.current > 3) {
            console.error(
              "🚨 Infinite redirect detected! Stopping navigation."
            );
            setAuthChecked(true);
            return;
          }
        } else {
          // Reset counter if enough time has passed or different path
          navigationCountRef.current = 0;
        }
      }

      // If no credentials and not on the login page or temp password change page, redirect to login
      if (
        !hasCredentials &&
        location.pathname !== "/login" &&
        !location.pathname.startsWith("/temp-password-change")
      ) {
        console.log("🔄 No auth credentials found, redirecting to login");
        lastNavigationRef.current = { path: "/login", timestamp: now };
        navigate("/login", { replace: true });
      }
      // If credentials exist and on the login page, redirect to dashboard
      else if (hasCredentials && location.pathname === "/login") {
        console.log("🔄 Auth credentials found, redirecting to dashboard");
        lastNavigationRef.current = { path: "/dashboard", timestamp: now };
        navigate("/dashboard", { replace: true });
      } else {
        console.log("✅ No redirect needed:", {
          hasCredentials,
          currentPath: location.pathname,
        });
      }

      setAuthChecked(true);
    };

    // Add a small delay to prevent conflicts with other navigation
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, navigate]); // Rerun when path changes

  // --- Listen for logout events ---
  useEffect(() => {
    const handleLogoutEvent = () => {
      console.log("🔄 Logout event received, redirecting to login");
      navigate("/login", { replace: true });
    };

    window.addEventListener("authLogout", handleLogoutEvent);
    return () => {
      window.removeEventListener("authLogout", handleLogoutEvent);
    };
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Determine if we are on the login page or temp password change page
  const isLoginPage = location.pathname === "/login";
  const isTempPasswordChangePage = location.pathname.startsWith(
    "/temp-password-change"
  );
  const isAuthPage = isLoginPage || isTempPasswordChangePage;

  // Show loading screen while checking authentication to prevent flicker
  if (!authChecked) {
    return <PageLoader />;
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MUILocalizationProvider>
          <SecurityProvider>
            <SnackbarProvider
              maxSnack={3} // Maximum number of snackbars to show at once
              anchorOrigin={{
                // Position of the snackbars
                vertical: "bottom",
                horizontal: "right",
              }}
              autoHideDuration={5000} // How long the snackbar stays visible (in milliseconds)
              // customize icon variants, actions, etc. here if needed
              iconVariant={{
                success: "✅",
                error: "❌",
                warning: "⚠️",
                info: "ℹ️",
              }}
            >
              <UserPermissionsProvider>
                {/* Security Alert Component */}
                <SecurityAlert />

                <div className="app">
                  {/* Render Sidebar and Topbar only if not on auth pages */}
                  {!isAuthPage && (
                    <Sidebar
                      isSidebarOpen={isSidebarOpen}
                      setIsSidebarOpen={setIsSidebarOpen}
                      isNonMobile={isNonMobile}
                    />
                  )}
                  <main className="content">
                    {!isAuthPage && (
                      <Topbar
                        toggleSidebar={toggleSidebar}
                        isNonMobile={isNonMobile}
                      />
                    )}
                    <Box flexGrow={1} overflow="auto" pl={1} pr={0.5}>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/not-authorized"
                          element={<NotAuthorized />}
                        />
                        {/* Protected Routes - wrapped by ProtectedRoute */}
                        {/* <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        /> */}
                        <Route
                          path="/roles"
                          element={
                            <ProtectedRoute>
                              <RolesManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/role-form"
                          element={
                            <ProtectedRoute>
                              <RoleForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/modules"
                          element={
                            <ProtectedRoute>
                              <ModuleManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/module-form"
                          element={
                            <ProtectedRoute>
                              <ModuleForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/locations"
                          element={
                            <ProtectedRoute>
                              <LocationManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/location-form"
                          element={
                            <ProtectedRoute>
                              <LocationForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/location-types"
                          element={
                            <ProtectedRoute>
                              <LocationTypeManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/location-type-form"
                          element={
                            <ProtectedRoute>
                              <LocationTypeForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/role-presets"
                          element={
                            <ProtectedRoute>
                              <RolePresetsManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/role-preset-form"
                          element={
                            <ProtectedRoute>
                              <RolePresetForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/companies"
                          element={
                            <ProtectedRoute>
                              <CompanyManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/company-form"
                          element={
                            <ProtectedRoute>
                              <CompanyForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/access-keys"
                          element={
                            <ProtectedRoute>
                              <AccessKeyManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/access-key-form"
                          element={
                            <ProtectedRoute>
                              <AccessKeyForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute>
                              <UserManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/user-form"
                          element={
                            <ProtectedRoute>
                              <UserForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/regions"
                          element={
                            <ProtectedRoute>
                              <RegionManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/region-form"
                          element={
                            <ProtectedRoute>
                              <RegionForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/take-out-stores"
                          element={
                            <ProtectedRoute>
                              <TakeOutStoreManagement />
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/positions"
                          element={
                            <ProtectedRoute>
                              <PositionManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/position-form"
                          element={
                            <ProtectedRoute>
                              <PositionForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/employees"
                          element={
                            <ProtectedRoute>
                              <EmployeeManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/employee-form"
                          element={
                            <ProtectedRoute>
                              <EmployeeForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/employees/upload"
                          element={
                            <ProtectedRoute>
                              <EmployeeUploadPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/transactions"
                          element={
                            <ProtectedRoute>
                              <TransactionManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/transaction-form"
                          element={
                            <ProtectedRoute>
                              <TransactionForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/transaction-view"
                          element={
                            <ProtectedRoute>
                              <TransactionView />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/incentive-trans-report"
                          element={
                            <ProtectedRoute>
                              <IncentiveTransReport />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <IncentiveTransDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-employees"
                          element={
                            <ProtectedRoute>
                              <StoreEmployeeManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-employee-form"
                          element={
                            <ProtectedRoute>
                              <StoreEmployeeForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-employees/upload"
                          element={
                            <ProtectedRoute>
                              <StoreEmployeeUploadPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/audit-trail"
                          element={
                            <ProtectedRoute>
                              <AuditTrailManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/audit-trail/:id"
                          element={
                            <ProtectedRoute>
                              <AuditTrailDetail />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-hurdles"
                          element={
                            <ProtectedRoute>
                              <StoreHurdleManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-hurdle-form"
                          element={
                            <ProtectedRoute>
                              <StoreHurdleForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-hurdles/upload"
                          element={
                            <ProtectedRoute>
                              <StoreHurdleUploadPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-rates"
                          element={
                            <ProtectedRoute>
                              <StoreRateManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-rate-form"
                          element={
                            <ProtectedRoute>
                              <StoreRateForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/store-rate-upload"
                          element={
                            <ProtectedRoute>
                              <StoreRateUploadPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/sales-transactions"
                          element={
                            <ProtectedRoute>
                              <SalesTransactionsListing />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/sales-transactions/view"
                          element={
                            <ProtectedRoute>
                              <SalesTransactionView />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/sales-budget-transactions"
                          element={
                            <ProtectedRoute>
                              <SalesBudgetTransactionsListing />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/sales-budget-transactions/view"
                          element={
                            <ProtectedRoute>
                              <SalesBudgetTransactionView />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/sales-budget-transactions/upload"
                          element={
                            <ProtectedRoute>
                              <SalesBudgetTransactionUploadPage />
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/temp-password-change/:userId/:userName"
                          element={<TempPasswordChange />}
                        />
                        <Route
                          path="/user-uploading"
                          element={
                            <ProtectedRoute>
                              <UserUploadingPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/user-upload"
                          element={
                            <ProtectedRoute>
                              <UserUploadingPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Fallback route - defaults to dashboard if authenticated, otherwise login */}
                        <Route
                          path="*"
                          element={
                            <ProtectedRoute>
                              <IncentiveTransDashboard />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Box>
                  </main>
                </div>
              </UserPermissionsProvider>
            </SnackbarProvider>
          </SecurityProvider>
        </MUILocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
