// src/pages/TempPasswordChange/TempPasswordChange.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { TempPasswordChangeFormValues } from "@/types/TempPasswordTypes";
import { changeTempPassword } from "@/api/tempPasswordApi";
import { calculatePasswordStrength } from "@/utils/passwordStrength";
import { secureLogout } from "@/utils/secureAuth";
import InputTextField from "@/components/InputTextField";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import LockResetIcon from "@mui/icons-material/LockReset";
import SaveIcon from "@mui/icons-material/Save";
import { tokens } from "@/styles/theme";

const TempPasswordChange: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userId, userName } = useParams<{
    userId: string;
    userName: string;
  }>();
  const { put } = useApi();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Redirect to login if params are missing
  React.useEffect(() => {
    if (!userId || !userName) {
      navigate("/login");
    }
  }, [userId, userName, navigate]);

  // Password validation schema
  const passwordValidationSchema = Yup.object().shape({
    new_password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("New password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("new_password")], "Passwords must match")
      .required("Please confirm your new password"),
  });

  const initialValues: TempPasswordChangeFormValues = {
    new_password: "",
    confirm_password: "",
  };

  const handleSubmit = async (
    values: TempPasswordChangeFormValues,
    { setSubmitting }: FormikHelpers<TempPasswordChangeFormValues>
  ) => {
    if (!userId) {
      setError("User ID is missing. Please try logging in again.");
      setSubmitting(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await changeTempPassword({ put }, userId, {
        new_password: values.new_password,
      });

      // Logout user and redirect to login with message
      secureLogout();

      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.greenAccent[700]} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <LockResetIcon
              sx={{ fontSize: 60, color: "warning.main", mb: 2 }}
            />
            <Typography variant="h4" gutterBottom>
              Password Reset Required
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hello {userName}, you must change your password before continuing.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={passwordValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting }) => {
              const passwordStrength = calculatePasswordStrength(
                values.new_password
              );

              return (
                <Form>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <InputTextField
                      name="new_password"
                      label="New Password"
                      type="password"
                      disabled={isSubmitting || loading}
                      fullWidth
                    />

                    {values.new_password && (
                      <PasswordStrengthMeter metrics={passwordStrength} />
                    )}

                    <InputTextField
                      name="confirm_password"
                      label="Confirm New Password"
                      type="password"
                      disabled={isSubmitting || loading}
                      fullWidth
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<SaveIcon />}
                      disabled={isSubmitting || loading}
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      {isSubmitting || loading
                        ? "Changing Password..."
                        : "Change Password"}
                    </Button>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, textAlign: "center" }}
                    >
                      After changing your password, you will be logged out and
                      need to re-login.
                    </Typography>
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TempPasswordChange;
