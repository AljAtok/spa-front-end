import React, { useEffect, useState, useMemo } from "react";
import { Box } from "@mui/material";
import InputTextField from "@/components/InputTextField";
import InputSelectField from "@/components/InputSelectField";
import InputMultiSelectField from "@/components/InputMultiSelectField";
import { StepComponentProps } from "@/types/formTypes";
import { useApi } from "@/hooks/useApi";
import { fetchTakeOutStores } from "@/api/takeOutStoreApi";

interface LocationType {
  id: number;
  location_name: string;
}

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

const StoreRateDetailsStep: React.FC<
  StepComponentProps<StoreRateFormValues>
> = ({ formikProps }) => {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await get("/locations");
      const data = Array.isArray(res)
        ? res
        : (res as { data: LocationType[] }).data;
      setLocations(data);
    };
    fetchLocations();
  }, [get]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!formikProps.values.location_id) {
        setWarehouses([]);
        setLoading(false);
        return;
      }
      const allWarehouses = await fetchTakeOutStores({ get });
      let warehouseList: WarehouseType[] = [];
      if (Array.isArray(allWarehouses)) {
        warehouseList = allWarehouses;
      } else if (
        allWarehouses &&
        typeof allWarehouses === "object" &&
        Array.isArray((allWarehouses as { data?: unknown }).data)
      ) {
        warehouseList = (allWarehouses as { data: WarehouseType[] }).data;
      }
      setWarehouses(
        warehouseList.filter(
          (w: WarehouseType) =>
            w.status_id === 1 &&
            w.location_id === formikProps.values.location_id
        )
      );
      setLoading(false);
    };
    fetchWarehouses();
  }, [get, formikProps.values.location_id]);

  useEffect(() => {
    // Debugging: log formikProps.values on every render
    console.log(
      "[DEBUG] StoreRateDetailsStep formikProps.values:",
      formikProps.values
    );
  });

  const locationOptions = useMemo(
    () => locations.map((loc) => ({ label: loc.location_name, value: loc.id })),
    [locations]
  );
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: w.warehouse_name, value: w.id })),
    [warehouses]
  );

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
      <InputTextField
        name="warehouse_rate"
        label="Warehouse Rate"
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
      <InputSelectField
        name="location_id"
        label="Location"
        required
        options={locationOptions}
        onChange={(_event, newValue) => {
          formikProps.setFieldValue(
            "location_id",
            newValue ? newValue.value : ""
          );
          formikProps.setFieldValue("warehouse_ids", []);
        }}
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 2",
          },
        }}
      />
      <InputMultiSelectField
        name="warehouse_ids"
        label="Warehouses"
        options={warehouseOptions}
        required
        disabled={loading || !formikProps.values.location_id}
        sx={{
          gridColumn: {
            xs: "span 1",
            sm: "span 1",
            md: "span 4",
          },
        }}
      />
      <InputSelectField
        name="status_id"
        label="Status"
        required
        options={[
          { label: "Active", value: 1 },
          { label: "Inactive", value: 2 },
        ]}
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

export default StoreRateDetailsStep;
