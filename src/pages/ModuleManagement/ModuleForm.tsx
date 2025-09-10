// src/pages/ModuleManagement/ModuleForm.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as Yup from "yup";
import { Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { FormikHelpers } from "formik";
import { useSnackbar } from "notistack";

import InputTextField from "../../components/InputTextField";
import InputRadioGroupField from "../../components/InputRadioGroupField";
import MultiStepForm from "../../components/MultiStepForm";

import { ModuleFormValues } from "../../types/ModuleTypes";
import {
  StepComponentProps,
  FormStep,
  RadioOption,
} from "../../types/formTypes";
import {
  fetchModuleById,
  createModule,
  updateModule,
} from "../../api/moduleApi";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import PermissionGuard from "../../components/PermissionGuard";

// Module status options
const moduleStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Module Details Step Component
const ModuleDetailsStep: React.FC<
  StepComponentProps<ModuleFormValues>
> = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Module Details
      </Typography>
      <InputTextField name="module_name" label="Module Name" required />
      <InputTextField name="module_alias" label="Module Alias" required />
      <InputTextField name="module_link" label="Module Link" required />
      <InputTextField name="parent_title" label="Parent Title" />
      <InputTextField name="menu_title" label="Menu Title" required />
      <InputTextField name="link_name" label="Link Name" required />
      <InputTextField
        name="order_level"
        label="Order Level"
        type="number"
        required
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={moduleStatusOptions}
        required
      />
    </Box>
  );
};

// Review Step Component
const ReviewModuleStep: React.FC<StepComponentProps<ModuleFormValues>> = ({
  values,
}) => {
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      moduleStatusOptions.find((opt) => opt.value == statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Module Details
      </Typography>

      <Typography variant="body2">
        <strong>Module Name:</strong> {values.module_name}
      </Typography>
      <Typography variant="body2">
        <strong>Module Alias:</strong> {values.module_alias}
      </Typography>
      <Typography variant="body2">
        <strong>Module Link:</strong> {values.module_link}
      </Typography>
      <Typography variant="body2">
        <strong>Parent Title:</strong> {values.parent_title}
      </Typography>
      <Typography variant="body2">
        <strong>Menu Title:</strong> {values.menu_title}
      </Typography>

      <Typography variant="body2">
        <strong>Link Name:</strong> {values.link_name}
      </Typography>
      <Typography variant="body2">
        <strong>Order Level:</strong> {values.order_level}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

// Main ModuleForm Component
const ModuleForm: React.FC = () => {
  const [moduleData, setModuleData] = useState<ModuleFormValues | null>(null);
  const [loadingModuleData, setLoadingModuleData] = useState<boolean>(true);

  const navigate = useNavigate();
  const location = useLocation();
  const moduleId = (location.state as { moduleId?: string })?.moduleId;
  const isEditMode = !!moduleId;
  const formHeaderTitle = isEditMode ? "EDIT MODULE" : "ADD MODULE";

  const { enqueueSnackbar } = useSnackbar();
  const apiInstance = useApi();

  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadModuleData = useCallback(async () => {
    if (isEditMode && moduleId) {
      setLoadingModuleData(true);
      try {
        const data = await fetchModuleById({ get }, moduleId);
        if (data) {
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setModuleData({
            module_name: data.module_name,
            module_alias: data.module_alias,
            module_link: data.module_link,
            menu_title: data.menu_title,
            parent_title: data.parent_title,
            link_name: data.link_name,
            order_level: Number(data.order_level) || 0,
            status: mappedStatus,
          });
        } else {
          console.warn(`Module with ID ${moduleId} not found.`);
          navigate("/modules", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching module data:", error);
        const errorMessage = getErrorMessage(
          error,
          "Failed to load module data"
        );
        enqueueSnackbar(errorMessage, { variant: "error" });
        navigate("/modules", { replace: true });
      } finally {
        setLoadingModuleData(false);
      }
    } else {
      setLoadingModuleData(false);
    }
  }, [isEditMode, moduleId, navigate, enqueueSnackbar, get]);

  useEffect(() => {
    loadModuleData();
  }, [loadModuleData]);

  const stepsConfig: FormStep<ModuleFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Module Details",
        component: ModuleDetailsStep,
        fields: [
          "module_name",
          "module_alias",
          "module_link",
          "menu_title",
          "parent_title",
          "link_name",
          "order_level",
          "status",
        ],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewModuleStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: ModuleFormValues = useMemo(() => {
    const defaultValues: ModuleFormValues = {
      module_name: "",
      module_alias: "",
      module_link: "",
      menu_title: "",
      parent_title: "",
      link_name: "",
      order_level: 0,
      status: 1,
    };

    if (isEditMode && moduleData) {
      return { ...defaultValues, ...moduleData };
    }

    return defaultValues;
  }, [isEditMode, moduleData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      module_name: Yup.string().required("Module Name is required"),
      module_alias: Yup.string().required("Module Alias is required"),
      module_link: Yup.string().required("Module Link is required"),
      menu_title: Yup.string().required("Menu Title is required"),
      // parent_title: Yup.string().required("Parent Title is required"),
      // parent_title: Yup.string().default(""),
      parent_title: Yup.string()
        .default("")
        .transform((value) => value || ""),
      link_name: Yup.string().required("Link Name is required"),
      order_level: Yup.number()
        .required("Order Level is required")
        .min(1, "Order Level must be at least 1")
        .integer("Order Level must be an integer")
        .typeError("Order Level must be a number"), // Add typeError for numeric inputs
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleFinalSubmit = async (
    values: ModuleFormValues,
    formikHelpers: FormikHelpers<ModuleFormValues>
  ) => {
    const apiPayload = {
      ...values,
      status_id: +values.status,
    };

    try {
      if (isEditMode && moduleId) {
        console.log("Submitting updated Module:", apiPayload, "ID:", moduleId);
        await updateModule({ put }, moduleId, apiPayload);
      } else {
        console.log("Submitting new Module:", apiPayload);
        await createModule({ post }, apiPayload);
      }
      formikHelpers.resetForm();
      navigate("/modules", { replace: true });
    } catch (error: unknown) {
      console.error("Module submission error:", error);
      //   const errorMessage = getErrorMessage(error, "Module submission error!");
      //   enqueueSnackbar(errorMessage, { variant: "error" });
      throw error;
    }
  };
  const handleHeaderBackClick = useCallback(() => {
    navigate("/modules");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="modules"
      isEditMode={isEditMode}
      loadingText="Module Form"
    >
      <MultiStepForm<ModuleFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleFinalSubmit}
        isLoadingInitialData={loadingModuleData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/modules"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Modules List"
      />
    </PermissionGuard>
  );
};

export default ModuleForm;
