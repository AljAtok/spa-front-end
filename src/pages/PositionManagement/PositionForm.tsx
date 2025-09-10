import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";

import InputRadioGroupField from "@/components/InputRadioGroupField";
import { Position, PositionFormValues } from "@/types/PositionTypes";

import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";

import { createPosition, updatePosition } from "@/api/positionApi";
import PermissionGuard from "@/components/PermissionGuard";

const statusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

const PositionDetailsStep: React.FC<
  StepComponentProps<PositionFormValues>
> = () => {
  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns="repeat(4, minmax(0, 1fr))"
    >
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Position Name"
        name="position_name"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Position Abbreviation"
        name="position_abbr"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={statusOptions}
        required
      />
    </Box>
  );
};

const ReviewPositionStep: React.FC<StepComponentProps<PositionFormValues>> = ({
  values,
}) => {
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      statusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Position Details
      </Typography>
      <Typography variant="body2">
        <strong>Position Name:</strong> {values.position_name}
      </Typography>
      <Typography variant="body2">
        <strong>Position Abbreviation:</strong> {values.position_abbr}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

const PositionForm: React.FC = () => {
  const [positionData, setPositionData] = useState<PositionFormValues | null>(
    null
  );
  const [loadingPositionData, setLoadingPositionData] = useState<boolean>(true);
  const navigate = useNavigate();
  const { state } = useLocation();
  const positionId = state?.positionId;
  const isEditMode = Boolean(positionId);
  const formHeaderTitle = isEditMode ? "Edit Position" : "Add Position";
  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadPositionData = useCallback(async () => {
    if (isEditMode && positionId) {
      setLoadingPositionData(true);
      try {
        const response = (await get(`/positions/${positionId}`)) as Position;
        if (response) {
          setPositionData({
            position_name: response.position_name || "",
            position_abbr: response.position_abbr || "",
            status: response.status_id === 1 ? 1 : 2,
          });
        } else {
          navigate("/positions", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load position details"
        );
        console.error("Error loading position:", error, errorMessage);
        navigate("/positions", { replace: true });
      } finally {
        setLoadingPositionData(false);
      }
    } else {
      setLoadingPositionData(false);
    }
  }, [isEditMode, positionId, navigate, get]);

  useEffect(() => {
    loadPositionData();
  }, [loadPositionData]);

  const stepsConfig: FormStep<PositionFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Position Details",
        component: PositionDetailsStep,
        fields: ["position_name", "position_abbr", "status"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewPositionStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: PositionFormValues = useMemo(() => {
    const defaultValues: PositionFormValues = {
      position_name: "",
      position_abbr: "",
      status: 1,
    };
    if (isEditMode && positionData) {
      return { ...defaultValues, ...positionData };
    }
    return defaultValues;
  }, [isEditMode, positionData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      position_name: Yup.string().required("Position Name is required"),
      position_abbr: Yup.string().required("Position Abbreviation is required"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: PositionFormValues,
    formikHelpers: FormikHelpers<PositionFormValues>
  ) => {
    try {
      const apiPayload = {
        position_name: values.position_name,
        position_abbr: values.position_abbr,
        status_id: +values.status,
      };
      if (isEditMode && positionId) {
        await updatePosition({ put }, String(positionId), apiPayload);
      } else {
        await createPosition({ post }, apiPayload);
      }
      formikHelpers.resetForm();
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save position");
      console.error("Error saving position:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/positions");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="positions"
      isEditMode={isEditMode}
      loadingText="Position Form"
    >
      <MultiStepForm<PositionFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingPositionData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/positions"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Positions List"
      />
    </PermissionGuard>
  );
};

export default PositionForm;
