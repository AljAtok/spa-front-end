import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputSelectField from "@/components/InputSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { LocationType, LocationFormValues } from "@/types/LocationTypes";
import { Region } from "@/types/RegionTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchLocationById } from "@/api/locationApi";
import { fetchAllRegions } from "@/api/regionApi";
import PermissionGuard from "@/components/PermissionGuard";

// Status options for radio buttons
const locationStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Location Details Step Component
const LocationDetailsStep: React.FC<
  StepComponentProps<LocationFormValues>
> = () => {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadLocationTypes = async () => {
      try {
        const response = await get<LocationType[] | { data: LocationType[] }>(
          "/location-types"
        );
        let typesData: LocationType[] = [];
        if (Array.isArray(response)) {
          typesData = response;
        } else if (
          response &&
          typeof response === "object" &&
          "data" in response
        ) {
          typesData = response.data || [];
        }
        const activeTypes = typesData.filter((type) => type.status_id === 1);
        setLocationTypes(activeTypes);
        setError(null);
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load location types"
        );
        setError(errorMessage);
        console.error("Error loading location types:", error);
      }
    };
    loadLocationTypes();
  }, [get]);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const allRegions = await fetchAllRegions({ get });
        let regionList: Region[] = [];
        if (Array.isArray(allRegions)) {
          regionList = allRegions;
        } else if (
          allRegions &&
          typeof allRegions === "object" &&
          "data" in allRegions
        ) {
          regionList = allRegions.data || [];
        }
        setRegions(regionList.filter((r) => r.status_id === 1));
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load regions"));
      }
    };
    loadRegions();
  }, [get]);

  const locationTypeOptions = useMemo(
    () =>
      locationTypes.map((type) => ({
        value: type.id,
        label: type.location_type_name,
      })),
    [locationTypes]
  );

  const regionOptions = useMemo(
    () =>
      regions.map((region) => ({
        value: region.id,
        label: region.region_name,
      })),
    [regions]
  );

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

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
        label="Location Name"
        name="location_name"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Location Code"
        name="location_code"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Location Abbreviation"
        name="location_abbr"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="location_type_id"
        label="Location Type"
        options={locationTypeOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputSelectField
        name="region_id"
        label="Region"
        options={regionOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={locationStatusOptions}
        required
      />
    </Box>
  );
};

// Review Step Component
const ReviewLocationStep: React.FC<StepComponentProps<LocationFormValues>> = ({
  values,
}) => {
  const [locationTypeDetails, setLocationTypeDetails] =
    useState<LocationType | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadLocationTypeDetails = async () => {
      if (values.location_type_id > 0) {
        try {
          const response = await get<{ data: LocationType }>(
            `/location-types/${values.location_type_id}`
          );
          if (response && typeof response === "object" && "data" in response) {
            setLocationTypeDetails(response.data);
          } else {
            setLocationTypeDetails(response);
          }
          console.log(response.data);
        } catch (error) {
          console.error("Error loading location type details:", error);
        }
      }
    };
    loadLocationTypeDetails();
  }, [get, values.location_type_id]);

  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      locationStatusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Location Details
      </Typography>

      <Typography variant="body2">
        <strong>Location Name:</strong> {values.location_name}
      </Typography>
      <Typography variant="body2">
        <strong>Location Code:</strong> {values.location_code}
      </Typography>
      <Typography variant="body2">
        <strong>Location Abbreviation:</strong> {values.location_abbr}
      </Typography>
      <Typography variant="body2">
        <strong>Location Type:</strong>{" "}
        {locationTypeDetails
          ? locationTypeDetails.location_type_name
          : "Loading..."}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

const LocationForm: React.FC = () => {
  const [locationData, setLocationData] = useState<LocationFormValues | null>(
    null
  );
  const [loadingLocationData, setLoadingLocationData] = useState<boolean>(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const locationId = state?.locationId;
  const isEditMode = Boolean(locationId);
  const formHeaderTitle = isEditMode ? "Edit Location" : "Add Location";

  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );
  const loadLocationData = useCallback(async () => {
    if (isEditMode && locationId) {
      setLoadingLocationData(true);
      try {
        const data = await fetchLocationById({ get }, locationId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setLocationData({
            location_name: data.location_name ?? "",
            location_code:
              typeof data.location_code === "string" ? data.location_code : "",
            location_abbr:
              typeof data.location_abbr === "string" ? data.location_abbr : "",
            location_type_id: Number(data.location_type_id) || 0,
            region_id: Number(data.region_id) || 0,
            status: mappedStatus,
          });
        } else {
          console.warn(`Location with ID ${locationId} not found.`);
          navigate("/locations", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load location details"
        );
        console.error("Error loading location:", error, errorMessage);
        navigate("/locations", { replace: true });
      } finally {
        setLoadingLocationData(false);
      }
    } else {
      setLoadingLocationData(false);
    }
  }, [isEditMode, locationId, navigate, get]);

  useEffect(() => {
    loadLocationData();
  }, [loadLocationData]);

  const stepsConfig: FormStep<LocationFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Location Details",
        component: LocationDetailsStep,
        fields: [
          "location_name",
          "location_code",
          "location_abbr",
          "location_type_id",
          "region_id",
          "status",
        ],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewLocationStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: LocationFormValues = useMemo(() => {
    const defaultValues: LocationFormValues = {
      location_name: "",
      location_code: "",
      location_abbr: "",
      location_type_id: 0,
      region_id: 0,
      status: 1,
    };

    if (isEditMode && locationData) {
      return { ...defaultValues, ...locationData };
    }

    return defaultValues;
  }, [isEditMode, locationData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      location_name: Yup.string()
        .required("Location Name is required")
        .min(2, "Location Name must be at least 2 characters")
        .max(50, "Location Name must not exceed 50 characters"),
      location_code: Yup.string()
        .required("Location Code is required")
        .min(2, "Location Code must be at least 2 characters")
        .max(20, "Location Code must not exceed 20 characters"),
      location_abbr: Yup.string()
        .required("Location Abbreviation is required")
        .min(2, "Abbreviation must be at least 2 characters")
        .max(10, "Abbreviation must not exceed 10 characters"),
      location_type_id: Yup.number()
        .required("Location Type is required")
        .min(1, "Please select a Location Type"),
      region_id: Yup.number()
        .required("Region is required")
        .min(1, "Please select a Region"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: LocationFormValues,
    formikHelpers: FormikHelpers<LocationFormValues>
  ) => {
    try {
      // Convert form values to API format
      const apiPayload = {
        location_name: values.location_name,
        location_code: values.location_code,
        location_abbr: values.location_abbr,
        location_type_id: values.location_type_id,
        region_id: values.region_id,
        status_id: +values.status, // Convert status to status_id
      };

      if (isEditMode && locationId) {
        console.log(
          "Submitting updated Location:",
          apiPayload,
          "ID:",
          locationId
        );
        await put(`/locations/${locationId}`, apiPayload);
      } else {
        console.log("Submitting new Location:", apiPayload);
        await post("/locations", apiPayload);
      }
      formikHelpers.resetForm();
      navigate("/locations", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save location");
      console.error("Error saving location:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/locations");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="locations"
      isEditMode={isEditMode}
      loadingText="Location Form"
    >
      <MultiStepForm<LocationFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingLocationData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/locations"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Locations List"
      />
    </PermissionGuard>
  );
};

export default LocationForm;
