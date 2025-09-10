// src/pages/ProfilePage/ProfilePage.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useApi } from "@/hooks/useApi";
import { UserLoggedData } from "@/types/UserTypes";
import {
  ProfileFormValues,
  PasswordChangeFormValues,
} from "@/types/ProfileTypes";
import {
  updateUserProfile,
  changeUserPassword,
  uploadProfilePicture,
} from "@/api/profileApi";
import { calculatePasswordStrength } from "@/utils/passwordStrength";
import FormHeader from "@/components/FormHeader";
import InputTextField from "@/components/InputTextField";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import ReusableTabs, { TabConfig } from "@/components/ReusableTabs";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import SaveIcon from "@mui/icons-material/Save";
// import { mt } from "date-fns/locale";

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(
    null
  );

  const { fullUserData, refetchUserPermission } = useUserPermissions();
  const { put, post } = useApi();
  const typedUserData = fullUserData as UserLoggedData | null;

  // Add local state for profile_pic_url to update immediately after upload
  const [profilePicUrl, setProfilePicUrl] = useState<string | undefined>(
    typedUserData?.user?.profile_pic_url || ""
  );

  // Profile form validation schema
  const profileValidationSchema = Yup.object().shape({
    first_name: Yup.string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .required("First name is required"),
    last_name: Yup.string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters")
      .required("Last name is required"),
  });

  // Password change validation schema
  const passwordValidationSchema = Yup.object().shape({
    current_password: Yup.string().required("Current password is required"),
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

  // Initial values
  const initialProfileValues: ProfileFormValues = {
    first_name: typedUserData?.user?.first_name || "",
    last_name: typedUserData?.user?.last_name || "",
    profile_pic_url: typedUserData?.user?.profile_pic_url || "",
  };

  const initialPasswordValues: PasswordChangeFormValues = {
    current_password: "",
    new_password: "",
    confirm_password: "",
  };

  const handleProfileSubmit = async (
    values: ProfileFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ProfileFormValues>
  ) => {
    if (!typedUserData?.user_id) {
      setError("User ID not found");
      setSubmitting(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile({ put }, typedUserData.user_id.toString(), {
        first_name: values.first_name,
        last_name: values.last_name,
        profile_pic_url: values.profile_pic_url,
      });

      // Refresh the UserPermissionsContext to get updated data
      refetchUserPermission();
      setSuccess("Profile updated successfully!");
      resetForm({ values });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (
    values: PasswordChangeFormValues,
    { setSubmitting, resetForm }: FormikHelpers<PasswordChangeFormValues>
  ) => {
    if (!typedUserData?.user_id) {
      setError("User ID not found");
      setSubmitting(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await changeUserPassword({ put }, typedUserData.user_id.toString(), {
        current_password: values.current_password,
        new_password: values.new_password,
      });

      setSuccess("Password changed successfully!");
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!typedUserData?.user_id) {
      setProfileImageError("User ID not found");
      return;
    }

    setProfileImageLoading(true);
    setProfileImageError(null);

    try {
      const response = await uploadProfilePicture(
        { post },
        typedUserData.user_id.toString(),
        file
      );
      refetchUserPermission();
      // Update local state with new profile_pic_url
      setProfilePicUrl(response.profile_pic_url);
      setSuccess("Profile picture updated successfully!");
    } catch (err) {
      setProfileImageError(
        err instanceof Error ? err.message : "Failed to upload profile picture"
      );
    } finally {
      setProfileImageLoading(false);
    }
  };

  const handleProfilePictureError = (error: string) => {
    setProfileImageError(error);
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const tabs: TabConfig[] = [
    {
      label: "Personal Information",
      icon: <PersonIcon />,
      content: (
        <Formik
          initialValues={initialProfileValues}
          validationSchema={profileValidationSchema}
          onSubmit={handleProfileSubmit}
          enableReinitialize
        >
          {({ values, isSubmitting, dirty }) => (
            <Form>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <ProfilePictureUpload
                    currentImageUrl={profilePicUrl || values.profile_pic_url}
                    onImageUpload={handleProfilePictureUpload}
                    loading={profileImageLoading}
                    error={profileImageError || undefined}
                    onError={handleProfilePictureError}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <InputTextField
                    name="first_name"
                    label="First Name"
                    type="text"
                    disabled={isSubmitting || loading}
                    fullWidth
                  />
                  <InputTextField
                    name="last_name"
                    label="Last Name"
                    type="text"
                    disabled={isSubmitting || loading}
                    fullWidth
                  />
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting || loading || !dirty}
                  >
                    {isSubmitting || loading ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      ),
    },
    {
      label: "Security",
      icon: <SecurityIcon />,
      content: (
        <Formik
          initialValues={initialPasswordValues}
          validationSchema={passwordValidationSchema}
          onSubmit={handlePasswordSubmit}
        >
          {({ values, isSubmitting, dirty }) => {
            const passwordStrength = calculatePasswordStrength(
              values.new_password
            );

            return (
              <Form>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    maxWidth: 500,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>

                  <InputTextField
                    name="current_password"
                    label="Current Password"
                    type="password"
                    disabled={isSubmitting || loading}
                    fullWidth
                  />

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

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 2,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={isSubmitting || loading || !dirty}
                    >
                      {isSubmitting || loading
                        ? "Changing..."
                        : "Change Password"}
                    </Button>
                  </Box>
                </Box>
              </Form>
            );
          }}
        </Formik>
      ),
    },
  ];

  if (!typedUserData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Unable to load user data</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <FormHeader
        title="Profile Settings"
        subtitle="Manage your personal information and security settings"
      />
      <Paper sx={{ mt: 1 }}>
        <ReusableTabs innserSX={{ pl: 2, pt: 3, pr: 2, pb: 3 }} tabs={tabs} />
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Discard Changes Dialog */}
      <Dialog
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
      >
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDiscardDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setShowDiscardDialog(false);
            }}
            color="error"
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
