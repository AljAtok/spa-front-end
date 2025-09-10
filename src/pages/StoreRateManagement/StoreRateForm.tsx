import React, { useEffect, useState } from "react";
// import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import * as Yup from "yup";
import MultiStepForm from "@/components/MultiStepForm";
import StoreRateDetailsStep from "./StoreRateDetailsStep";
import StoreRateReviewStep from "./StoreRateReviewStep";
import PermissionGuard from "@/components/PermissionGuard";

// Duplicate WarehouseType here for typing
interface WarehouseType {
  id: number;
  warehouse_name: string;
  location_id: number;
  status_id: number;
}

interface StoreRateFormValues {
  warehouse_rate: number | string;
  location_id: number | "";
  warehouse_ids: number[];
  status_id: number;
}

// Define a type for the edit data
interface StoreRateApiData {
  warehouse_rate: number | string;
  location_id?: number;
  warehouse_ids?: number[];
  warehouse_id?: number;
  status_id: number;
  id?: number;
  warehouse_name?: string;
  // Add other known fields from API as needed
}

const validationSchema = Yup.object().shape({
  warehouse_rate: Yup.number().required("Rate is required").min(0),
  location_id: Yup.number().required("Location is required"),
  warehouse_ids: Yup.array()
    .of(Yup.number().required())
    .min(1, "Select at least one warehouse")
    .required("Select at least one warehouse"),
  status_id: Yup.number().required(),
});

const stepsConfig = [
  {
    id: "details",
    title: "Store Rate Details",
    component: StoreRateDetailsStep,
    fields: [
      "warehouse_rate",
      "location_id",
      "warehouse_ids",
      "status_id",
    ] as (keyof StoreRateFormValues)[],
  },
  {
    id: "review",
    title: "Review",
    component: StoreRateReviewStep,
    fields: [],
  },
];

const StoreRateForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { post, put, get } = useApi();
  const [editId, setEditId] = useState<number | null>(null);
  const [allWarehouses, setAllWarehouses] = useState<WarehouseType[]>([]);
  const [editData, setEditData] = useState<StoreRateApiData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all warehouses for edit mode location lookup
  useEffect(() => {
    const fetchAllWarehouses = async () => {
      try {
        const all = await get("/warehouses/stores/1");
        const allData = all as { data?: WarehouseType[] };
        setAllWarehouses(Array.isArray(allData) ? allData : allData.data || []);
      } catch {
        setAllWarehouses([]);
      }
    };
    fetchAllWarehouses();
  }, [get]);

  // Fetch edit data if editing
  useEffect(() => {
    const fetchEditData = async () => {
      if (location.state && location.state.rateId) {
        setEditId(location.state.rateId);
        const res = await get(`/warehouse-rates/${location.state.rateId}`);
        const data = (res as { data?: unknown }).data || res;
        setEditData(data as StoreRateApiData);
      }
      setLoading(false);
    };
    fetchEditData();
  }, [get, location.state]);

  // Compute initialValues like StoreEmployeeForm
  const initialValues: StoreRateFormValues = React.useMemo(() => {
    let warehouse_rate: number | string = "";
    let location_id: number | "" = "";
    let warehouse_ids: number[] = [];
    let status_id: number = 1;
    if (editData) {
      warehouse_rate = editData.warehouse_rate ?? "";
      status_id = editData.status_id ?? 1;
      // Always use array for warehouse_ids
      if (
        Array.isArray(editData.warehouse_ids) &&
        editData.warehouse_ids.length > 0
      ) {
        warehouse_ids = editData.warehouse_ids;
      } else if (editData.warehouse_id) {
        warehouse_ids = [editData.warehouse_id];
      }
      // Derive location_id from warehouse if not present
      if (editData.location_id) {
        location_id = editData.location_id;
      } else if (warehouse_ids.length > 0 && allWarehouses.length > 0) {
        const wh = allWarehouses.find((w) => w.id === warehouse_ids[0]);
        if (wh) location_id = wh.location_id;
      }
    }
    return {
      warehouse_rate,
      location_id,
      warehouse_ids,
      status_id,
    };
  }, [editData, allWarehouses]);

  const handleSubmit = async (
    values: StoreRateFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    const payload = {
      warehouse_rate: Number(values.warehouse_rate),
      warehouse_ids: values.warehouse_ids,
      status_id: values.status_id,
    };
    if (editId) {
      await put(`/warehouse-rates/${editId}`, payload);
    } else {
      await post("/warehouse-rates", payload);
    }
    setSubmitting(false);
    navigate("/store-rates");
  };

  if (loading) return null;

  return (
    <PermissionGuard
      moduleAlias="store-employees"
      isEditMode={!!editId}
      loadingText="Store Employee Form"
    >
      <MultiStepForm<StoreRateFormValues>
        formHeaderTitle={editId ? "Edit Store Rate" : "Add Store Rate"}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isEditMode={!!editId}
        isLoadingInitialData={loading}
        onHeaderBackClick={() => navigate("/store-rates")}
        redirectPathAfterSubmit="/store-rates"
        headerActionButtonText="Back to Store Rates"
      />
    </PermissionGuard>
  );
};

export default StoreRateForm;
