import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import * as Yup from "yup";
import { FormikHelpers } from "formik";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { LocationTypeFormValues } from "@/types/LocationTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchLocationTypeById } from "@/api/locationTypeApi";
import PermissionGuard from "../../components/PermissionGuard";

// Status options for radio buttons
const locationTypeStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Step components
const LocationTypeDetails: React.FC<
  StepComponentProps<LocationTypeFormValues>
> = () => (
  <Box
    display="grid"
    gap="30px"
    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
  >
    <InputTextField
      fullWidth
      variant="filled"
      type="text"
      label="Location Type Name"
      name="location_type_name"
      required
      sx={{ gridColumn: "span 4" }}
    />
    <InputRadioGroupField<1 | 2>
      name="status"
      label="Status"
      options={locationTypeStatusOptions}
      required
    />
  </Box>
);

const ReviewLocationType: React.FC<
  StepComponentProps<LocationTypeFormValues>
> = ({ values }) => {
  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      locationTypeStatusOptions.find((opt) => opt.value === statusCode)
        ?.label || `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Location Type Details
      </Typography>

      <Typography variant="body2">
        <strong>Location Type Name:</strong> {values.location_type_name}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

const stepsConfig: FormStep<LocationTypeFormValues>[] = [
  {
    id: "details",
    title: "Location Type Details",
    component: LocationTypeDetails,
    fields: ["location_type_name", "status"],
  },
  {
    id: "review",
    title: "Review & Submit",
    component: ReviewLocationType,
    fields: [],
  },
];

const LocationTypeForm: React.FC = () => {
  const [locationTypeData, setLocationTypeData] =
    useState<LocationTypeFormValues | null>(null);
  const [loadingLocationTypeData, setLoadingLocationTypeData] =
    useState<boolean>(true);
  const navigate = useNavigate();
  const { state } = useLocation();
  const locationTypeId = state?.locationTypeId;
  const isEditMode = Boolean(locationTypeId);
  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadLocationTypeData = useCallback(async () => {
    if (isEditMode && locationTypeId) {
      setLoadingLocationTypeData(true);
      try {
        console.log("Fetching location type data...");
        const data = await fetchLocationTypeById({ get }, locationTypeId);
        console.log("Location type data:", data);
        if (data) {
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setLocationTypeData({
            location_type_name: data.location_type_name,
            status: mappedStatus,
          });
        } else {
          console.warn(`Location Type with ID ${locationTypeId} not found.`);
          navigate("/location-types", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load location type details"
        );
        console.error("Error loading location type:", error, errorMessage);
        navigate("/location-types", { replace: true });
      } finally {
        console.log("Setting loading to false");
        setLoadingLocationTypeData(false);
      }
    } else {
      setLoadingLocationTypeData(false);
    }
  }, [isEditMode, locationTypeId, navigate, get]);

  useEffect(() => {
    loadLocationTypeData();
  }, [loadLocationTypeData]);

  const stepsConfigMemo: FormStep<LocationTypeFormValues>[] = useMemo(
    () => stepsConfig,
    []
  );

  const initialValues: LocationTypeFormValues = useMemo(() => {
    const defaultValues: LocationTypeFormValues = {
      location_type_name: "",
      status: 1,
    };

    if (isEditMode && locationTypeData) {
      return { ...defaultValues, ...locationTypeData };
    }

    return defaultValues;
  }, [isEditMode, locationTypeData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      location_type_name: Yup.string()
        .required("Location Type Name is required")
        .min(2, "Location Type Name must be at least 2 characters")
        .max(50, "Location Type Name must not exceed 50 characters"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: LocationTypeFormValues,
    formikHelpers: FormikHelpers<LocationTypeFormValues>
  ) => {
    try {
      // Convert form values to API format
      const apiPayload = {
        location_type_name: values.location_type_name,
        status_id: +values.status, // Convert status to status_id
      };

      if (isEditMode && locationTypeId) {
        console.log(
          "Submitting updated Location Type:",
          apiPayload,
          "ID:",
          locationTypeId
        );
        await put(`/location-types/${locationTypeId}`, apiPayload);
      } else {
        console.log("Submitting new Location Type:", apiPayload);
        await post("/location-types", apiPayload);
      }
      formikHelpers.resetForm();
      navigate("/location-types", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to save location type"
      );
      console.error("Error saving location type:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/location-types");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="location-types"
      isEditMode={isEditMode}
      loadingText="Location Type Form"
    >
      <MultiStepForm<LocationTypeFormValues>
        formHeaderTitle={
          isEditMode ? "EDIT LOCATION TYPE" : "ADD LOCATION TYPE"
        }
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfigMemo}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingLocationTypeData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/location-types"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Location Types List"
      />
    </PermissionGuard>
  );
};

export default LocationTypeForm;
