import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useApi } from "@/hooks/useApi";
import InputSelectField from "@/components/InputSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { StoreEmployeeFormValues } from "@/types/StoreEmployeeType";
import { TakeOutStore } from "@/types/TakeOutStoreTypes";
import { Employee } from "@/types/EmployeeTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { StepComponentProps, RadioOption } from "@/types/formTypes";
import { fetchStoreEmployeeById } from "@/api/storeEmployeeApi";
import { fetchTakeOutStores } from "@/api/takeOutStoreApi";
import { fetchEmployees } from "@/api/employeeApi";
import { fetchUserNestedAccessKeyByID } from "@/api/userApi";
import PermissionGuard from "@/components/PermissionGuard";
import { NestedUserLocation, UserLoggedData } from "@/types/UserTypes";
import * as Yup from "yup";
import { getErrorMessage } from "@/utils/errorUtils";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const statusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

const StoreEmployeeDetailsStep: React.FC<
  StepComponentProps<
    StoreEmployeeFormValues & { location_filter?: number | null }
  >
> = ({
  // values,
  formikProps,
}) => {
  const [locations, setLocations] = useState<NestedUserLocation[]>([]);
  const [warehouses, setWarehouses] = useState<TakeOutStore[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  // Get user permissions
  const { fullUserData } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;

  // Fetch locations for filter dropdown
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Use the userId from the fullUserData or fallback to a default
        const userId = typedUserData?.user_id || 0;
        const response = await fetchUserNestedAccessKeyByID(
          { get },
          String(userId)
        );
        if (response && Array.isArray(response.locations)) {
          setLocations(response.locations.filter((l) => l.status_id === 1));
        }
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load locations"));
      }
    };
    loadLocations();
  }, [get, typedUserData]);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const allWarehouses = await fetchTakeOutStores({ get });
        const warehouseList: TakeOutStore[] = Array.isArray(allWarehouses)
          ? allWarehouses
          : allWarehouses.data || [];
        setWarehouses(warehouseList.filter((w) => w.status_id === 1));
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load warehouses"));
      }
    };
    loadWarehouses();
  }, [get]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const allEmployees = await fetchEmployees({ get });
        const employeeList: Employee[] = Array.isArray(allEmployees)
          ? allEmployees
          : allEmployees.data || [];
        setEmployees(employeeList.filter((e) => e.status_id === 1));
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load employees"));
      }
    };
    loadEmployees();
  }, [get]);

  // Filtered lists based on selected location (from Formik)
  const selectedLocationId = formikProps.values.location_filter ?? null;
  const filteredWarehouses = useMemo(
    () =>
      selectedLocationId
        ? warehouses.filter((w) => w.location_id === selectedLocationId)
        : warehouses,
    [warehouses, selectedLocationId]
  );
  const filteredEmployees = useMemo(
    () =>
      selectedLocationId
        ? employees.filter((e) =>
            e.locations.some((loc) => loc.location_id === selectedLocationId)
          )
        : employees,
    [employees, selectedLocationId]
  );

  // For dropdowns NOT filtered by location
  // const allEmployees = employees;

  const filterByPositionName = useCallback(
    (names: string[], list: Employee[]) =>
      list.filter((e) => names.includes(e.position_abbr)),
    []
  );

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({ value: Number(l.id), label: l.location_name })),
    [locations]
  );
  const warehouseOptions = useMemo(
    () =>
      filteredWarehouses.map((w) => ({
        value: Number(w.id),
        label: w.warehouse_name,
      })),
    [filteredWarehouses]
  );
  const ssOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(
            ["SS", "AH", "BCH", "RH"],
            filteredEmployees
          ).map((e) => ({
            value: Number(e.id),
            label: `${e.employee_first_name} ${e.employee_last_name}`,
          }))
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );
  const ahOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(["AH", "BCH", "RH"], filteredEmployees).map(
            (e) => ({
              value: Number(e.id),
              label: `${e.employee_first_name} ${e.employee_last_name}`,
            })
          )
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );
  const bchOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(["AH", "BCH", "RH"], filteredEmployees).map(
            (e) => ({
              value: Number(e.id),
              label: `${e.employee_first_name} ${e.employee_last_name}`,
            })
          )
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );

  const gbchOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(["BCH", "RH"], filteredEmployees).map((e) => ({
            value: Number(e.id),
            label: `${e.employee_first_name} ${e.employee_last_name}`,
          }))
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );
  const rhOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(["BCH", "RH"], filteredEmployees).map((e) => ({
            value: Number(e.id),
            label: `${e.employee_first_name} ${e.employee_last_name}`,
          }))
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );
  const grhOptions = useMemo(
    () =>
      selectedLocationId
        ? filterByPositionName(["BCH", "RH", "GRH"], filteredEmployees).map(
            (e) => ({
              value: Number(e.id),
              label: `${e.employee_first_name} ${e.employee_last_name}`,
            })
          )
        : [],
    [filteredEmployees, filterByPositionName, selectedLocationId]
  );

  // Debug info
  // console.log('location_filter', formikProps.values.location_filter, typeof formikProps.values.location_filter);
  // console.log('locationOptions', locationOptions);
  // console.log('warehouseOptions', warehouseOptions);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns="repeat(4, minmax(0, 1fr))"
    >
      {/* Debug info */}
      {/* <Box gridColumn="span 4">
        <Typography variant="caption" color="gray">
          location_filter: {String(formikProps.values.location_filter)} |
          warehouses: {warehouseOptions.length} | ss: {ssOptions.length} | ah:{" "}
          {ahOptions.length} | bch: {bchOptions.length}
        </Typography>
      </Box> */}
      <InputSelectField
        name="location_filter"
        label="Location (Filter Only)"
        options={locationOptions}
        onChange={(_, value) => {
          let newValue: number | null = null;
          if (
            value &&
            typeof value === "object" &&
            "value" in value &&
            !isNaN(Number(value.value))
          ) {
            newValue = Number(value.value);
          }
          formikProps.setFieldValue("location_filter", newValue);
          formikProps.setFieldValue("warehouse_id", 0);
          // Clear all assigned personnel fields to ensure uniform store personnel per location
          formikProps.setFieldValue("assigned_ss", null);
          formikProps.setFieldValue("assigned_ah", null);
          formikProps.setFieldValue("assigned_bch", null);
          formikProps.setFieldValue("assigned_gbch", null);
          formikProps.setFieldValue("assigned_rh", null);
          formikProps.setFieldValue("assigned_grh", null);
        }}
        sx={{ gridColumn: "span 4" }}
      />
      <InputSelectField
        name="warehouse_id"
        label="Store"
        options={warehouseOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputSelectField
        name="assigned_ss"
        label="Assigned SS"
        options={ssOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="assigned_ah"
        label="Assigned AH"
        options={ahOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="assigned_bch"
        label="Assigned BCH"
        options={bchOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="assigned_gbch"
        label="Assigned GBCH"
        options={gbchOptions}
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="assigned_rh"
        label="Assigned RH"
        options={rhOptions}
        required
        sx={{ gridColumn: "span 2" }}
      />
      <InputSelectField
        name="assigned_grh"
        label="Assigned GRH"
        options={grhOptions}
        sx={{ gridColumn: "span 2" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status_id"
        label="Status"
        options={statusOptions}
        required
      />
    </Box>
  );
};

const ReviewStoreEmployeeStep: React.FC<
  StepComponentProps<StoreEmployeeFormValues>
> = ({ values }) => {
  // For brevity, just show IDs and status
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      statusOptions.find((opt) => opt.value == statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Store Employee Details
      </Typography>
      <Typography variant="body2">
        <strong>Store ID:</strong> {values.warehouse_id}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned SS:</strong> {values.assigned_ss}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned AH:</strong> {values.assigned_ah}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned BCH:</strong> {values.assigned_bch}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned GBCH:</strong> {values.assigned_gbch}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned RH:</strong> {values.assigned_rh}
      </Typography>
      <Typography variant="body2">
        <strong>Assigned GRH:</strong> {values.assigned_grh}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status_id)}
      </Typography>
    </Box>
  );
};

const StoreEmployeeForm: React.FC = () => {
  const [employeeData, setEmployeeData] =
    useState<StoreEmployeeFormValues | null>(null);
  const [loadingEmployeeData, setLoadingEmployeeData] = useState<boolean>(true);
  const [allWarehouses, setAllWarehouses] = useState<TakeOutStore[]>([]); // <-- add
  const navigate = useNavigate();
  const { state } = useLocation();
  const storeEmployeeId = state?.storeEmployeeId;
  const isEditMode = Boolean(storeEmployeeId);
  const formHeaderTitle = isEditMode
    ? "Edit Store Personnel"
    : "Add Store Personnel";
  const apiInstance = useApi();
  // const { get } = useMemo(() => ({ get: apiInstance.get }), [apiInstance]);
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  // Debugging output for edit mode
  console.log("StoreEmployeeForm debug:", {
    state,
    storeEmployeeId,
    isEditMode,
    employeeData,
    loadingEmployeeData,
    allWarehouses,
  });

  // Fetch all warehouses for edit mode location lookup
  useEffect(() => {
    const fetchAllWarehouses = async () => {
      try {
        const all = await fetchTakeOutStores({ get });
        setAllWarehouses(Array.isArray(all) ? all : all.data || []);
      } catch {
        setAllWarehouses([]);
      }
    };
    fetchAllWarehouses();
  }, [get]);

  const loadEmployeeData = useCallback(async () => {
    if (isEditMode && storeEmployeeId) {
      setLoadingEmployeeData(true);
      try {
        const data = await fetchStoreEmployeeById({ get }, storeEmployeeId);
        if (data) {
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;
          setEmployeeData({
            warehouse_id: data.warehouse_id ?? "",
            assigned_ss: data.assigned_ss ?? null,
            assigned_ah: data.assigned_ah ?? null,
            assigned_bch: data.assigned_bch ?? null,
            assigned_gbch: data.assigned_gbch ?? null,
            assigned_rh: data.assigned_rh ?? null,
            assigned_grh: data.assigned_grh ?? null,
            status_id: mappedStatus,
          });
        } else {
          navigate("/warehouse-employees", { replace: true });
        }
      } catch (error) {
        console.log("Error:", error);
        navigate("/warehouse-employees", { replace: true });
      } finally {
        setLoadingEmployeeData(false);
      }
    } else {
      setLoadingEmployeeData(false);
    }
  }, [isEditMode, storeEmployeeId, navigate, get]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  const stepsConfig = useMemo(
    () => [
      {
        id: "details",
        title: "Store Employee Details",
        component: StoreEmployeeDetailsStep,
        fields: [
          "location_filter",
          "warehouse_id",
          "assigned_ss",
          "assigned_ah",
          "assigned_bch",
          "assigned_gbch",
          "assigned_rh",
          "assigned_grh",
          "status_id",
        ] as (keyof (StoreEmployeeFormValues & {
          location_filter?: number | null;
        }))[],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewStoreEmployeeStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: StoreEmployeeFormValues & {
    location_filter?: number | null;
  } = useMemo(() => {
    const defaultValues: StoreEmployeeFormValues & {
      location_filter?: number | null;
    } = {
      warehouse_id: "",
      assigned_ss: null,
      assigned_ah: null,
      assigned_bch: null,
      assigned_gbch: null,
      assigned_rh: null,
      assigned_grh: null,
      status_id: 1,
      location_filter: null,
    };
    if (isEditMode && employeeData) {
      let location_filter: number | null = null;
      if (employeeData.warehouse_id && allWarehouses.length > 0) {
        const wh = allWarehouses.find(
          (w) => w.id === employeeData.warehouse_id
        );
        if (wh) location_filter = wh.location_id;
      }
      return { ...defaultValues, ...employeeData, location_filter };
    }
    return defaultValues;
  }, [isEditMode, employeeData, allWarehouses]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      warehouse_id: Yup.mixed<number | "">()
        .test(
          "required",
          "Warehouse is required",
          (v) => typeof v === "number" && v > 0
        )
        .defined(),
      assigned_ss: Yup.number().nullable().required("Assigned SS is required"),
      assigned_ah: Yup.number().nullable().required("Assigned AH is required"),
      assigned_bch: Yup.number()
        .nullable()
        .required("Assigned BCH is required"),
      assigned_gbch: Yup.number().nullable().default(null),
      assigned_rh: Yup.number().nullable().required("Assigned RH is required"),
      assigned_grh: Yup.number().nullable().default(null),
      status_id: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
      location_filter: Yup.number().nullable().notRequired(),
    });
  }, []);

  const handleSubmit = async (
    values: StoreEmployeeFormValues & { location_filter?: number | null }
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { location_filter, ...apiPayload } = values;
    const submitPayload = {
      ...apiPayload,
      status_id: +values.status_id,
    };
    if (isEditMode && storeEmployeeId) {
      await put(`/warehouse-employees/${storeEmployeeId}`, submitPayload);
    } else {
      await post("/warehouse-employees", submitPayload);
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/store-employees");
  }, [navigate]);

  if (isEditMode && (loadingEmployeeData || !employeeData)) {
    return (
      <Box p={4}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <PermissionGuard
      moduleAlias="store-employees"
      isEditMode={isEditMode}
      loadingText="Store Employee Form"
    >
      <MultiStepForm<
        StoreEmployeeFormValues & { location_filter?: number | null }
      >
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingEmployeeData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/store-employees"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Store Personnel List"
      />
    </PermissionGuard>
  );
};

export default StoreEmployeeForm;
