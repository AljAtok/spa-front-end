// src/pages/RegionManagement/RegionForm.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import PermissionGuard from "@/components/PermissionGuard";
import { RegionFormValues } from "@/types/RegionTypes";
import { fetchRegionById } from "@/api/regionApi";

// Status options for radio buttons
const regionStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Region Details Step Component
const RegionDetailsStep: React.FC<
  StepComponentProps<RegionFormValues>
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
        label="Region Name"
        name="region_name"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Region Abbreviation"
        name="region_abbr"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={regionStatusOptions}
        required
      />
    </Box>
  );
};

// Review Step Component
const ReviewRegionStep: React.FC<StepComponentProps<RegionFormValues>> = ({
  values,
}) => {
  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      regionStatusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Region Details
      </Typography>
      <Typography variant="body2">
        <strong>Region Name:</strong> {values.region_name}
      </Typography>
      <Typography variant="body2">
        <strong>Region Abbreviation:</strong> {values.region_abbr}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

const RegionForm: React.FC = () => {
  const [regionData, setRegionData] = useState<RegionFormValues | null>(null);
  const [loadingRegionData, setLoadingRegionData] = useState<boolean>(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const regionId = state?.regionId;
  const isEditMode = Boolean(regionId);
  const formHeaderTitle = isEditMode ? "Edit Region" : "Add Region";

  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadRegionData = useCallback(async () => {
    if (isEditMode && regionId) {
      setLoadingRegionData(true);
      try {
        const data = await fetchRegionById({ get }, regionId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;
          setRegionData({
            region_name: data.region_name || "",
            region_abbr: data.region_abbr || "",
            status: mappedStatus,
          });
        } else {
          navigate("/regions", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load region details"
        );
        console.error("Error loading region:", error, errorMessage);
        navigate("/regions", { replace: true });
      } finally {
        setLoadingRegionData(false);
      }
    } else {
      setLoadingRegionData(false);
    }
  }, [isEditMode, regionId, navigate, get]);

  useEffect(() => {
    loadRegionData();
  }, [loadRegionData]);

  const stepsConfig: FormStep<RegionFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Region Details",
        component: RegionDetailsStep,
        fields: ["region_name", "region_abbr", "status"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewRegionStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: RegionFormValues = useMemo(() => {
    const defaultValues: RegionFormValues = {
      region_name: "",
      region_abbr: "",
      status: 1,
    };
    if (isEditMode && regionData) {
      return { ...defaultValues, ...regionData };
    }
    return defaultValues;
  }, [isEditMode, regionData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      region_name: Yup.string()
        .required("Region Name is required")
        .min(2, "Region Name must be at least 2 characters")
        .max(50, "Region Name must not exceed 50 characters"),
      region_abbr: Yup.string()
        .required("Region Abbreviation is required")
        .min(2, "Abbreviation must be at least 2 characters")
        .max(10, "Abbreviation must not exceed 10 characters"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: RegionFormValues,
    formikHelpers: FormikHelpers<RegionFormValues>
  ) => {
    try {
      // Convert form values to API format
      const apiPayload = {
        region_name: values.region_name,
        region_abbr: values.region_abbr,
        status_id: +values.status, // Convert status to status_id
      };
      if (isEditMode && regionId) {
        await put(`/regions/${regionId}`, apiPayload);
      } else {
        await post("/regions", apiPayload);
      }
      formikHelpers.resetForm();
      navigate("/regions", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save region");
      console.error("Error saving region:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/regions");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="regions"
      isEditMode={isEditMode}
      loadingText="Region Form"
    >
      <MultiStepForm<RegionFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingRegionData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/regions"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Regions List"
      />
    </PermissionGuard>
  );
};

export default RegionForm;
