// src/pages/Auth/LoginPage.tsx
import React, { useState } from "react";
import { Box, Paper, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as yup from "yup";

import api from "../../api/axiosConfig";
import { useTheme } from "@mui/material";
import { tokens } from "../../styles/theme";
import { getRememberMePreference } from "../../utils/auth";
import {
  secureStoreAuthTokens,
  sanitizeAuthInput,
  secureGetRememberMePreference,
} from "../../utils/secureAuth";
import { performSecurityAudit } from "../../utils/security";

import InputTextField from "../../components/InputTextField";
import InputCheckBoxField from "../../components/InputCheckBoxField";
import ActionButton from "../../components/ActionButton";
import LoginIcon from "@mui/icons-material/Login";

// 1. Define an interface for form values
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Define validation schema using Yup
const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  rememberMe: yup.boolean(),
});

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Perform security audit on component mount
  React.useEffect(() => {
    const audit = performSecurityAudit();
    if (audit.vulnerabilities.length > 0) {
      console.warn(
        "🔒 Security vulnerabilities detected:",
        audit.vulnerabilities
      );
    }
  }, []);

  // Get remembered email and preferences
  const getRememberedEmail = (): string => {
    const rememberedEmail = localStorage.getItem("rememberedEmail") || "";
    // Sanitize the remembered email for security
    return sanitizeAuthInput(rememberedEmail, "email");
  };
  const getInitialRememberMe = (): boolean => {
    // Use secure preference getter with fallback to legacy
    return secureGetRememberMePreference() || getRememberMePreference();
  };

  // Authentication routing is handled by App.tsx

  // auth check here to avoid conflicts, if needed
  // for the onSubmit handler
  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Sanitize inputs before sending to server
      const sanitizedEmail = sanitizeAuthInput(values.email, "email");
      const sanitizedPassword = sanitizeAuthInput(values.password, "password");

      console.log("🔐 Login attempt with security validation");

      const response = await api.post("/auth/login", {
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      const { access_token, refresh_token, user } = response.data; // Use secure token storage instead of legacy storage
      secureStoreAuthTokens(
        access_token,
        refresh_token,
        user,
        values.rememberMe,
        false // Don't skip logout during login - we want to clear any existing sessions
      );

      // Store or clear the remembered email based on remember me preference
      if (values.rememberMe) {
        // Sanitize email before storing
        const emailToStore = sanitizeAuthInput(values.email, "email");
        localStorage.setItem("rememberedEmail", emailToStore);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      console.log(`✅ Secure login successful: ${user.name || user.email}`);
      console.log(
        `🔐 Remember me: ${values.rememberMe ? "enabled" : "disabled"}`
      );

      // Check if user needs to change password (user_reset flag)
      if (user.user_reset) {
        // console.log("🔐 User password reset required, redirecting to temporary password change");
        navigate(
          `/temp-password-change/${user.id}/${encodeURIComponent(
            user.user_name
          )}`,
          { replace: true }
        );
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object" &&
        (err as { response?: unknown }).response !== null
      ) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message || "Invalid credentials"
        );
      } else if (typeof err === "object" && err !== null && "request" in err) {
        // The request was made but no response was received
        setError("No response from server. Please try again later.");
      } else {
        // Something else happened in setting up the request that triggered an Error
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }; // 3. Define initialValues with the correct type
  const initialValues: LoginFormValues = {
    email: getRememberedEmail(),
    password: "",
    rememberMe: getInitialRememberMe(),
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.greenAccent[700]} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* App Name and Welcome */}
      <Box
        sx={{
          position: "absolute",
          top: 40,
          left: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        {/* <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: 1.5,
            color: colors.grey[100],
            textShadow: "0 2px 8px rgba(0,0,0,0.12)",
            mb: 0.5,
          }}
        >
          SPA{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 400,
              fontSize: 22,
              ml: 1,
              color: colors.greenAccent[200],
            }}
          >
            (Success Perks Award)
          </Box>
        </Typography> */}
        {/* <Typography
          variant="subtitle1"
          sx={{ color: colors.grey[200], mb: 2, fontSize: 18 }}
        >
          Welcome! Please sign in to your account
        </Typography> */}
      </Box>

      {/* Login Card */}
      <Paper
        elevation={8}
        sx={{
          p: { xs: 3, sm: 5 },
          pt: 6,
          pb: 5,
          borderRadius: 4,
          maxWidth: 400,
          width: "95%",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 3,
          background: `rgba(255,255,255,0.98)`,
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: 1.5,
              color: colors.grey[100],
              textShadow: "0 2px 8px rgba(0,0,0,0.12)",
              mb: 0.5,
            }}
          >
            {import.meta.env.VITE_SYS_NAME}
          </Typography>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.greenAccent[600]} 60%, ${colors.primary[400]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
            }}
          >
            <LoginIcon sx={{ color: "#fff", fontSize: 36 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: colors.primary[700],
              mb: 0.5,
            }}
          >
            Sign in to {import.meta.env.VITE_SYS_ABBR}
          </Typography>
        </Box>
        <Formik
          initialValues={initialValues}
          validationSchema={loginValidationSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting }) => (
            <Form style={{ width: "100%" }}>
              <InputTextField
                name="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
              <InputTextField
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                sx={{ mb: 2 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <InputCheckBoxField name="rememberMe" label="Remember me" />
              </Box>
              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <ActionButton
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                text={loading ? "Logging In..." : "Sign In"}
                icon={LoginIcon}
                disabled={loading || isSubmitting}
                sx={{
                  mt: 1,
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${colors.greenAccent[600]} 60%, ${colors.primary[400]} 100%)`,
                  boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                  "&:hover": {
                    background: `linear-gradient(90deg, ${colors.greenAccent[700]} 60%, ${colors.primary[500]} 100%)`,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : null}
              </ActionButton>
            </Form>
          )}
        </Formik>
        <Box sx={{ mt: 3, width: "100%", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} {import.meta.env.VITE_COMPANY_NAME}.
            All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
