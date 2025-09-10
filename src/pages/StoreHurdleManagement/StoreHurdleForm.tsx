import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useApi } from "@/hooks/useApi";
import InputSelectField from "@/components/InputSelectField";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import InputTextField from "@/components/InputTextField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import MultiStepForm from "@/components/MultiStepForm";
import {
  StepComponentProps,
  RadioOption,
  MultiStepFormProps,
} from "@/types/formTypes";
import { fetchTakeOutStores } from "@/api/takeOutStoreApi";
import { fetchUserNestedAccessKeyByID } from "@/api/userApi";
import {
  StoreHurdleFormValues,
  StoreHurdleLocation,
  StoreHurdleWarehouse,
  StoreHurdleItemCategory,
} from "@/types/StoreHurdleFormTypes";
import * as Yup from "yup";
import InputVirtualizedMultiSelectField from "@/components/InputVirtualizedMultiSelectField";
import TextField from "@mui/material/TextField";
import { fetchStoreHurdleById } from "@/api/storeHurdleApi";
import InputMonthPickerField from "@/components/InputMonthPickerField";
import PageLoader from "@/components/PageLoader";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UserLoggedData } from "@/types/UserTypes";

const statusOptions: RadioOption<3 | 6>[] = [
  { label: "Pending", value: 3 },
  { label: "For approval", value: 6 },
];

// Update the props type for StoreHurdleDetailsStep
const StoreHurdleDetailsStep: React.FC<
  StepComponentProps<StoreHurdleFormValues> & {
    isEditMode: boolean;
    locations: StoreHurdleLocation[];
    warehouses: StoreHurdleWarehouse[];
    itemCategories: StoreHurdleItemCategory[];
  }
> = ({ formikProps, isEditMode, locations, warehouses, itemCategories }) => {
  // Compute location value in edit mode
  const editWarehouse = isEditMode
    ? warehouses.find(
        (w: StoreHurdleWarehouse) =>
          w.id === formikProps.values.warehouse_ids[0]
      )
    : undefined;
  const editLocationId = editWarehouse ? editWarehouse.location_id : null;

  const selectedLocationId = isEditMode
    ? editLocationId
    : formikProps.values.location_filter ?? null;
  const filteredWarehouses = useMemo(
    () =>
      selectedLocationId
        ? warehouses.filter(
            (w: StoreHurdleWarehouse) => w.location_id === selectedLocationId
          )
        : warehouses,
    [warehouses, selectedLocationId]
  );
  const locationOptions = useMemo(
    () =>
      locations.map((l: StoreHurdleLocation) => ({
        value: l.id,
        label: l.location_name,
      })),
    [locations]
  );
  const warehouseOptions = useMemo(
    () =>
      filteredWarehouses.map((w: StoreHurdleWarehouse) => ({
        value: w.id,
        label: w.warehouse_name,
      })),
    [filteredWarehouses]
  );
  const itemCategoryOptions = useMemo(
    () =>
      itemCategories.map((c: StoreHurdleItemCategory) => ({
        value: c.id,
        label: c.name,
      })),
    [itemCategories]
  );

  // Debug logs for dropdowns and values
  console.log("locationOptions", locationOptions);
  console.log("warehouseOptions", warehouseOptions);
  console.log("itemCategoryOptions", itemCategoryOptions);
  console.log("formikProps.values", formikProps.values);
  console.log("isEditMode", isEditMode);

  // Map Formik values to option objects for dropdowns
  const selectedWarehouseOption = isEditMode
    ? warehouseOptions.find(
        (opt: { value: number; label: string }) =>
          opt.value === formikProps.values.warehouse_ids[0]
      ) || null
    : null;
  const selectedWarehouseOptions = !isEditMode
    ? formikProps.values.warehouse_ids
        .map((id: number | string) =>
          warehouseOptions.find(
            (w: { value: number; label: string }) => w.value === id
          )
        )
        .filter((opt): opt is { value: number; label: string } => Boolean(opt))
    : [];
  const selectedLocationOption =
    locationOptions.find(
      (opt: { value: number; label: string }) =>
        opt.value === formikProps.values.location_filter
    ) || null;
  const selectedItemCategoryOptions = formikProps.values.item_category_ids
    .map((id: number | string) =>
      itemCategoryOptions.find(
        (c: { value: number; label: string }) => c.value === id
      )
    )
    .filter((opt): opt is { value: number; label: string } => Boolean(opt));

  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns={{
        xs: "1fr", // Single column on extra small screens
        sm: "repeat(2, 1fr)", // Two columns on small screens
        md: "repeat(4, minmax(0, 1fr))", // Four columns on medium and larger screens
      }}
    >
      <InputSelectField
        name="location_filter"
        label="Location (Filter Only)"
        options={locationOptions}
        value={selectedLocationOption}
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
          formikProps.setFieldValue("warehouse_ids", []);
        }}
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 4",
          },
        }}
      />
      <Box sx={{ gridColumn: "span 4" }}>
        {isEditMode ? (
          <InputSelectField
            name="warehouse_ids"
            label="Warehouses"
            options={warehouseOptions}
            value={selectedWarehouseOption}
            onChange={(_, value) => {
              formikProps.setFieldValue(
                "warehouse_ids",
                value ? [value.value] : []
              );
            }}
            required
          />
        ) : (
          <InputVirtualizedMultiSelectField
            label="Warehouses"
            options={warehouseOptions}
            value={selectedWarehouseOptions}
            onChange={(selected) => {
              formikProps.setFieldValue(
                "warehouse_ids",
                selected.map((opt) => opt.value)
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Warehouses" required />
            )}
          />
        )}
      </Box>
      <InputMultiSelectField
        name="item_category_ids"
        label="Item Categories"
        options={itemCategoryOptions}
        value={selectedItemCategoryOptions}
        onChange={(_, value) => {
          formikProps.setFieldValue(
            "item_category_ids",
            value
              ? value.map(
                  (v: { value: string | number; label: string }) => v.value
                )
              : []
          );
        }}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />

      <InputMonthPickerField
        name="hurdle_date"
        label="Hurdle Month"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputTextField
        name="ss_hurdle_qty"
        label="Hurdle Qty"
        type="number"
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputRadioGroupField<3 | 6>
        name="status_id"
        label="Status"
        options={statusOptions}
        required
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
    </Box>
  );
};

const ReviewStoreHurdleStep: React.FC<
  StepComponentProps<StoreHurdleFormValues>
> = ({ values }) => (
  <Box>
    <Typography variant="h6" gutterBottom>
      Review Store Hurdle Details
    </Typography>
    <Typography variant="body2">
      <strong>Warehouses:</strong> {values.warehouse_ids.join(", ")}
    </Typography>
    <Typography variant="body2">
      <strong>Item Categories:</strong> {values.item_category_ids.join(", ")}
    </Typography>
    <Typography variant="body2">
      <strong>Hurdle Qty:</strong> {values.ss_hurdle_qty}
    </Typography>
    <Typography variant="body2">
      <strong>Hurdle Date:</strong> {values.hurdle_date}
    </Typography>
    <Typography variant="body2">
      <strong>Status:</strong>{" "}
      {values.status_id == 3 ? "Pending" : "For Approval"}
    </Typography>
  </Box>
);

const StoreHurdleForm: React.FC = () => {
  const [hurdleData, setHurdleData] = useState<StoreHurdleFormValues | null>(
    null
  );
  const [loadingHurdleData, setLoadingHurdleData] = useState<boolean>(true);
  const [allWarehouses, setAllWarehouses] = useState<StoreHurdleWarehouse[]>(
    []
  );
  const [locations, setLocations] = useState<StoreHurdleLocation[]>([]);
  const [warehouses, setWarehouses] = useState<StoreHurdleWarehouse[]>([]);
  const [itemCategories, setItemCategories] = useState<
    StoreHurdleItemCategory[]
  >([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const hurdleId = state?.hurdleId;
  const currentTabIndex = state?.currentTabIndex;
  const isEditMode = Boolean(hurdleId);
  const formHeaderTitle = isEditMode ? "Edit Store Hurdle" : "Add Store Hurdle";
  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  // Get user permissions
  const { fullUserData } = useUserPermissions();
  const typedUserData = fullUserData as UserLoggedData | null;

  // Debugging output for edit mode
  console.log("StoreHurdleForm debug:", {
    state,
    hurdleId,
    isEditMode,
    hurdleData,
    loadingHurdleData,
    allWarehouses,
  });

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const userId = typedUserData?.user_id || 0;
        const response = await fetchUserNestedAccessKeyByID(
          { get },
          String(userId)
        );
        if (response && Array.isArray(response.locations)) {
          setLocations(
            response.locations.filter(
              (l: StoreHurdleLocation) => l.status_id === 1
            )
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Optionally handle error
      }
    };
    loadLocations();
  }, [get, typedUserData]);

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const allWarehousesResp = await fetchTakeOutStores({ get });
        const warehouseList: StoreHurdleWarehouse[] = Array.isArray(
          allWarehousesResp
        )
          ? allWarehousesResp
          : allWarehousesResp.data || [];
        setWarehouses(warehouseList.filter((w) => w.status_id === 1));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Optionally handle error
      }
    };
    loadWarehouses();
  }, [get]);

  // Load item categories
  useEffect(() => {
    const loadItemCategories = async () => {
      try {
        const response = await get("/item-categories");
        const categories: StoreHurdleItemCategory[] = Array.isArray(response)
          ? (response as StoreHurdleItemCategory[])
          : (response as { data: StoreHurdleItemCategory[] }).data;
        setItemCategories(categories.filter((c) => c.status_id === 1));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Optionally handle error
      }
    };
    loadItemCategories();
  }, [get]);

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

  // Fetch hurdle data in edit mode
  useEffect(() => {
    const loadHurdleData = async () => {
      if (isEditMode && hurdleId) {
        setLoadingHurdleData(true);
        try {
          const data = await fetchStoreHurdleById({ get }, hurdleId);
          console.log("Fetched hurdleData:", data);
          setHurdleData({
            warehouse_ids: Array.isArray(data.warehouse_ids)
              ? data.warehouse_ids
              : typeof data.warehouse_id === "number"
              ? [data.warehouse_id]
              : [],
            item_category_ids: Array.isArray(data.item_category_ids)
              ? data.item_category_ids
              : Array.isArray(data.extension_categories)
              ? data.extension_categories.map((ec) => ec.item_category_id)
              : typeof data.item_category_id === "number"
              ? [data.item_category_id]
              : [],
            ss_hurdle_qty: data.ss_hurdle_qty,
            hurdle_date: data.hurdle_date,
            status_id: data.status_id,
            location_filter:
              typeof data.location_filter === "number" ||
              data.location_filter === null
                ? data.location_filter
                : null,
          });
        } catch (error) {
          console.log("Error loading hurdle data:", error);
          navigate("/store-hurdles", {
            replace: true,
            state: { urrentTabIndex: currentTabIndex },
          });
        } finally {
          setLoadingHurdleData(false);
        }
      } else {
        setLoadingHurdleData(false);
      }
    };
    loadHurdleData();
  }, [isEditMode, hurdleId, navigate, get, currentTabIndex]);

  const stepsConfig = useMemo<
    MultiStepFormProps<StoreHurdleFormValues>["stepsConfig"]
  >(
    () => [
      {
        id: "details",
        title: "Store Hurdle Details",
        component: (props) => (
          <StoreHurdleDetailsStep
            {...props}
            isEditMode={isEditMode}
            locations={locations}
            warehouses={warehouses}
            itemCategories={itemCategories}
          />
        ),
        fields: [
          "location_filter",
          "warehouse_ids",
          "item_category_ids",
          "ss_hurdle_qty",
          "hurdle_date",
          "status_id",
        ],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewStoreHurdleStep,
        fields: [],
      },
    ],
    [isEditMode, locations, warehouses, itemCategories]
  );

  const initialValues: StoreHurdleFormValues = useMemo(() => {
    const defaultValues: StoreHurdleFormValues = {
      location_filter: null,
      warehouse_ids: [],
      item_category_ids: [],
      ss_hurdle_qty: 0,
      hurdle_date: "",
      status_id: 3,
    };
    if (isEditMode && hurdleData && allWarehouses.length > 0) {
      // Find location_id from the first warehouse in warehouse_ids
      let location_filter: number | null = null;
      if (hurdleData.warehouse_ids && hurdleData.warehouse_ids.length > 0) {
        const wh = allWarehouses.find(
          (w) => w.id === hurdleData.warehouse_ids[0]
        );
        if (wh) location_filter = wh.location_id;
      }
      const debugVals = {
        ...defaultValues,
        ...hurdleData,
        location_filter,
      };
      console.log("StoreHurdleForm initialValues (edit):", debugVals);
      return debugVals;
    }
    console.log("StoreHurdleForm initialValues (add):", defaultValues);
    return defaultValues;
  }, [isEditMode, hurdleData, allWarehouses]);

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        warehouse_ids: Yup.array()
          .of(Yup.number().required())
          .min(1, "Select at least one warehouse")
          .required(),
        item_category_ids: Yup.array()
          .of(Yup.number().required())
          .min(1, "Select at least one item category")
          .required(),
        ss_hurdle_qty: Yup.number().min(1, "Hurdle Qty is required").required(),
        hurdle_date: Yup.string().required("Hurdle Date is required"),
        status_id: Yup.number<3 | 6>()
          .oneOf([3, 6], "Invalid Status")
          .required(),
        location_filter: Yup.number().nullable().default(null),
      }),
    []
  );

  const handleSubmit = async (values: StoreHurdleFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { location_filter, ...apiPayload } = values;
    apiPayload.status_id = +values.status_id as 3 | 1 | 2 | 6;
    if (isEditMode && hurdleId) {
      await put(`/warehouse-hurdles/${hurdleId}`, apiPayload);
    } else {
      await post("/warehouse-hurdles", apiPayload);
    }
    navigate("/store-hurdles", { state: { currentTabIndex: currentTabIndex } });
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/store-hurdles", { state: { currentTabIndex: currentTabIndex } });
  }, [navigate, currentTabIndex]);

  // Only render form when all data is loaded in edit mode
  const isDataReady =
    !isEditMode ||
    (!loadingHurdleData &&
      hurdleData &&
      allWarehouses.length > 0 &&
      itemCategories.length > 0 &&
      warehouses.length > 0 &&
      locations.length > 0);

  if (!isDataReady) {
    return <PageLoader />;
  }

  return (
    <MultiStepForm<StoreHurdleFormValues>
      formHeaderTitle={formHeaderTitle}
      initialValues={initialValues}
      validationSchema={validationSchema}
      stepsConfig={stepsConfig}
      onSubmit={handleSubmit}
      isEditMode={isEditMode}
      redirectPathAfterSubmit="/store-hurdles"
      onHeaderBackClick={handleHeaderBackClick}
      headerActionButtonText="Back to Store Hurdle List"
    />
  );
};

export default StoreHurdleForm;
