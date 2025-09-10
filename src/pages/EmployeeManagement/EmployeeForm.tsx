import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputSelectField from "@/components/InputSelectField";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { EmployeeFormValues } from "@/types/EmployeeTypes";
import { Location } from "@/types/LocationTypes";
import { Position } from "@/types/PositionTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchEmployeeById } from "@/api/employeeApi";
import { fetchAllLocations } from "@/api/locationApi";
import { fetchPositions } from "@/api/positionApi";
import PermissionGuard from "@/components/PermissionGuard";

const employeeStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

const EmployeeDetailsStep: React.FC<
  StepComponentProps<EmployeeFormValues>
> = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const allLocations = await fetchAllLocations({ get });
        const locationList: Location[] = Array.isArray(allLocations)
          ? allLocations
          : allLocations.data || [];
        setLocations(locationList.filter((l) => l.status_id === 1));
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load locations"));
      }
    };
    loadLocations();
  }, [get]);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const allPositions = await fetchPositions({ get });
        const positionList: Position[] = Array.isArray(allPositions)
          ? allPositions
          : allPositions.data || [];
        setPositions(positionList.filter((p) => p.status_id === 1));
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load positions"));
      }
    };
    loadPositions();
  }, [get]);

  const locationOptions = useMemo(
    () => locations.map((loc) => ({ value: loc.id, label: loc.location_name })),
    [locations]
  );
  const positionOptions = useMemo(
    () => positions.map((pos) => ({ value: pos.id, label: pos.position_name })),
    [positions]
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
        label="Employee Number"
        name="employee_number"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="First Name"
        name="employee_first_name"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Last Name"
        name="employee_last_name"
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="email"
        label="Email"
        name="employee_email"
        sx={{ gridColumn: "span 2" }}
      />
      <InputMultiSelectField
        name="location_ids"
        label="Locations"
        options={locationOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={employeeStatusOptions}
        required
      />
      <InputSelectField
        name="position_id"
        label="Position"
        options={positionOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
    </Box>
  );
};

const ReviewEmployeeStep: React.FC<StepComponentProps<EmployeeFormValues>> = ({
  values,
}) => {
  const [locationDetails, setLocationDetails] = useState<Location[]>([]);
  const [positionDetails, setPositionDetails] = useState<Position | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadDetails = async () => {
      if (values.location_ids && values.location_ids.length > 0) {
        try {
          const locationPromises = values.location_ids.map((id) =>
            get(`/locations/${id}`)
          );
          const responses = await Promise.all(locationPromises);
          setLocationDetails(responses as Location[]);
        } catch (error) {
          console.log("Error :", error);
        }
      }
      if (values.position_id > 0) {
        try {
          const response = await get(`/positions/${values.position_id}`);
          setPositionDetails(response as Position);
        } catch (error) {
          console.log("Error :", error);
        }
      }
    };
    loadDetails();
  }, [get, values.location_ids, values.position_id]);

  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      employeeStatusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Employee Details
      </Typography>
      <Typography variant="body2">
        <strong>Employee Number:</strong> {values.employee_number}
      </Typography>
      <Typography variant="body2">
        <strong>First Name:</strong> {values.employee_first_name}
      </Typography>
      <Typography variant="body2">
        <strong>Last Name:</strong> {values.employee_last_name}
      </Typography>
      <Typography variant="body2">
        <strong>Email:</strong> {values.employee_email}
      </Typography>
      <Typography variant="body2">
        <strong>Locations:</strong>{" "}
        {locationDetails.length > 0
          ? locationDetails.map((loc) => loc.location_name).join(", ")
          : "Loading..."}
      </Typography>
      <Typography variant="body2">
        <strong>Position:</strong>{" "}
        {positionDetails ? positionDetails.position_name : "Loading..."}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status)}
      </Typography>
    </Box>
  );
};

const EmployeeForm: React.FC = () => {
  const [employeeData, setEmployeeData] = useState<EmployeeFormValues | null>(
    null
  );
  const [loadingEmployeeData, setLoadingEmployeeData] = useState<boolean>(true);
  const navigate = useNavigate();
  const { state } = useLocation();
  const employeeId = state?.employeeId;
  const isEditMode = Boolean(employeeId);
  const formHeaderTitle = isEditMode ? "Edit Employee" : "Add Employee";
  //   const apiInstance = useApi();
  const { get, put, post } = useApi();
  //   const { get, post, put } = useMemo(
  //     () => ({
  //       get: apiInstance.get,
  //       post: apiInstance.post,
  //       put: apiInstance.put,
  //     }),
  //     [apiInstance]
  //   );
  const loadEmployeeData = useCallback(async () => {
    if (isEditMode && employeeId) {
      setLoadingEmployeeData(true);
      try {
        const data = await fetchEmployeeById({ get }, employeeId);
        if (data) {
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;
          setEmployeeData({
            employee_number: data.employee_number ?? "",
            employee_first_name: data.employee_first_name ?? "",
            employee_last_name: data.employee_last_name ?? "",
            employee_email: data.employee_email ?? "",
            location_ids: data.locations?.map((loc) => loc.location_id) || [],
            position_id: Number(data.position_id) || 0,
            status: mappedStatus,
          });
        } else {
          navigate("/employees", { replace: true });
        }
      } catch (error) {
        // navigate("/employees", { replace: true });
        console.log("Error :", error);
      } finally {
        setLoadingEmployeeData(false);
      }
    } else {
      setLoadingEmployeeData(false);
    }
  }, [isEditMode, employeeId, navigate, get]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  const stepsConfig: FormStep<EmployeeFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Employee Details",
        component: EmployeeDetailsStep,
        fields: [
          "employee_number",
          "employee_first_name",
          "employee_last_name",
          "employee_email",
          "location_ids",
          "position_id",
          "status",
        ],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewEmployeeStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: EmployeeFormValues = useMemo(() => {
    const defaultValues: EmployeeFormValues = {
      employee_number: "",
      employee_first_name: "",
      employee_last_name: "",
      employee_email: "",
      location_ids: [],
      position_id: 0,
      status: 1,
    };
    if (isEditMode && employeeData) {
      return { ...defaultValues, ...employeeData };
    }
    return defaultValues;
  }, [isEditMode, employeeData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      employee_number: Yup.string()
        .required("Employee Number is required")
        .min(2, "Employee Number must be at least 2 characters")
        .max(20, "Employee Number must not exceed 20 characters"),
      employee_first_name: Yup.string()
        .required("First Name is required")
        .min(2, "First Name must be at least 2 characters")
        .max(50, "First Name must not exceed 50 characters"),
      employee_last_name: Yup.string()
        .required("Last Name is required")
        .min(2, "Last Name must be at least 2 characters")
        .max(50, "Last Name must not exceed 50 characters"),
      employee_email: Yup.string()
        // .required("Email is required")
        .email("Invalid email address"),
      location_ids: Yup.array()
        .of(Yup.number().required())
        .min(1, "Please select at least one location")
        .required("Locations are required"),
      position_id: Yup.number()
        .required("Position is required")
        .min(1, "Please select a Position"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: EmployeeFormValues,
    formikHelpers: FormikHelpers<EmployeeFormValues>
  ) => {
    const apiPayload = {
      employee_number: values.employee_number,
      employee_first_name: values.employee_first_name,
      employee_last_name: values.employee_last_name,
      employee_email: values.employee_email,
      location_ids: values.location_ids,
      position_id: values.position_id,
      status_id: +values.status,
    };
    if (isEditMode && employeeId) {
      await put(`/employees/${employeeId}`, apiPayload);
    } else {
      await post("/employees", apiPayload);
    }
    formikHelpers.resetForm();
    navigate("/employees", { replace: true });
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/employees");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="employees"
      isEditMode={isEditMode}
      loadingText="Employee Form"
    >
      <MultiStepForm<EmployeeFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingEmployeeData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/employees"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Employees List"
      />
    </PermissionGuard>
  );
};

export default EmployeeForm;
