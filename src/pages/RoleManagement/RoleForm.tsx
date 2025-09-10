// src/components/RoleForm.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as Yup from "yup";
import { Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { FormikHelpers } from "formik"; // Import FormikProps and FormikHelpers
import { useSnackbar } from "notistack";

// Import reusable components
import InputTextField from "../../components/InputTextField"; // Adjust path as needed
import InputRadioGroupField from "../../components/InputRadioGroupField"; // Adjust path as needed
import MultiStepForm from "../../components/MultiStepForm"; // Adjust path as needed

// Import Role-specific types and API functions
import { RoleFormValues } from "../../types/RoleTypes"; // Adjust path
import {
  StepComponentProps,
  FormStep,
  RadioOption,
} from "../../types/formTypes"; // Adjust path
import { fetchRoleById, createRole, updateRole } from "../../api/roleApi"; // Adjust path
import { useApi } from "@/hooks/useApi";
import PermissionGuard from "../../components/PermissionGuard";
// import { getErrorMessage } from "@/utils/errorUtils";

// --- Mock Data for Dropdown Options ---
const roleStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 }, // Numeric value
  { label: "Inactive", value: 2 }, // Numeric value
];

// --- Step Components ---

const RoleDetailsStep: React.FC<StepComponentProps<RoleFormValues>> = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Role Details
      </Typography>
      <InputTextField name="role_name" label="Role Name" required />
      <InputTextField
        name="role_level"
        label="Role Level"
        type="number"
        required
      />
      {/* InputRadioGroupField's generic type now matches the numeric values */}
      <InputRadioGroupField<1 | 2> // Explicitly define the literal number types for options
        name="status"
        label="Status"
        options={roleStatusOptions} // This will now be type-correct
        required
      />
    </Box>
  );
};

const ReviewRoleStep: React.FC<StepComponentProps<RoleFormValues>> = ({
  values,
}) => {
  // Helper to display status more readably (maps numeric value back to label)
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      roleStatusOptions.find((opt) => opt.value == statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Role Details
      </Typography>

      <Typography variant="body2">
        <strong>Role Name:</strong> {values.role_name}
      </Typography>
      <Typography variant="body2">
        <strong>Role Level:</strong> {values.role_level}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

// --- Main RoleForm Component ---
const RoleForm: React.FC = () => {
  const [roleData, setRoleData] = useState<RoleFormValues | null>(null);
  const [loadingRoleData, setLoadingRoleData] = useState<boolean>(true);

  const navigate = useNavigate();
  const location = useLocation();
  const roleId = (location.state as { roleId?: string })?.roleId;
  const isEditMode = !!roleId;
  const formHeaderTitle = isEditMode ? "EDIT ROLE" : "ADD ROLE";

  const { enqueueSnackbar } = useSnackbar();

  // Initialize the api hook once at the component level
  const apiInstance = useApi();

  // Memoize just the methods we need
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );
  // Memoize the loadRoleData function to prevent unnecessary re-renders
  const loadRoleData = useCallback(async () => {
    if (isEditMode && roleId) {
      setLoadingRoleData(true);
      try {
        const data = await fetchRoleById({ get }, roleId);
        if (data) {
          // Map fetched API status to form value (1 or 2)
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setRoleData({
            role_name: data.role_name,
            role_level: data.role_level,
            status: mappedStatus,
          });
        } else {
          console.warn(`Role with ID ${roleId} not found.`);
          navigate("/roles", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching role data:", error);
        enqueueSnackbar("Failed to load role data. Please try again.", {
          variant: "error",
        });
        navigate("/roles", { replace: true });
      } finally {
        setLoadingRoleData(false);
      }
    } else {
      setLoadingRoleData(false);
    }
  }, [isEditMode, roleId, navigate, enqueueSnackbar, get]);

  // Effect to load role data
  useEffect(() => {
    loadRoleData();
  }, [loadRoleData]);

  const stepsConfig: FormStep<RoleFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Role Details",
        component: RoleDetailsStep,
        fields: ["role_name", "role_level", "status"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewRoleStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: RoleFormValues = useMemo(() => {
    const defaultValues: RoleFormValues = {
      role_name: "",
      role_level: 0,
      status: 1, // (Active)
    };

    if (isEditMode && roleData) {
      return { ...defaultValues, ...roleData };
    }

    return defaultValues;
  }, [isEditMode, roleData]);

  const combinedValidationSchema = useMemo(() => {
    return Yup.object().shape({
      role_name: Yup.string().required("Role Name is required"),
      role_level: Yup.number()
        .required("Role Level is required")
        .min(1, "Role Level must be at least 1")
        .integer("Role Level must be an integer")
        .typeError("Role Level must be a number"), // Add typeError for numeric inputs
      // Validate 'status' as 1 or 2
      status: Yup.number<1 | 2>() // Validate as a number, with literal types
        .oneOf([1, 2], "Invalid Status") // Check if it's either 1 or 2
        .required("Status is required"),
    });
  }, []);

  const handleFinalSubmit = async (
    values: RoleFormValues,
    formikHelpers: FormikHelpers<RoleFormValues>
  ) => {
    const apiPayload = {
      role_name: values.role_name,
      role_level: values.role_level,
      status_id: +values.status,
    };
    try {
      if (isEditMode && roleId) {
        console.log("Submitting updated Role:", apiPayload, "ID:", roleId);
        await updateRole({ put }, roleId, apiPayload);
      } else {
        console.log("Submitting new Role:", apiPayload);
        await createRole({ post }, apiPayload);
      }
      formikHelpers.resetForm();
    } catch (error: unknown) {
      console.error("Role submission error:", error);
      // const errorMessage = getErrorMessage(error, "Role submission error!");
      // enqueueSnackbar(errorMessage, { variant: "error" });
      throw error;
    }
  };
  const handleHeaderBackClick = useCallback(() => {
    navigate("/roles");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="roles"
      isEditMode={isEditMode}
      loadingText="Role Form"
    >
      <MultiStepForm<RoleFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={combinedValidationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleFinalSubmit}
        isLoadingInitialData={loadingRoleData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/roles"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Roles List"
      />
    </PermissionGuard>
  );
};

export default RoleForm;
