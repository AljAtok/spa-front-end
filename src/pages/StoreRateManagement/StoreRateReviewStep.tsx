import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { StepComponentProps } from "@/types/formTypes";

interface StoreRateFormValues {
  warehouse_rate: number | string;
  location_id: number | "";
  warehouse_ids: number[];
  status_id: number;
}

// Optionally, pass in location/warehouse lookup maps for better display
const StoreRateReviewStep: React.FC<
  StepComponentProps<StoreRateFormValues>
> = ({ values }) => {
  // have lookup maps for location/warehouse names, use them here for display
  // For now, just display IDs and values
  const getStatusLabel = (status: number) =>
    status === 1 ? "Active" : status === 2 ? "Inactive" : `Unknown (${status})`;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Store Rate Details
      </Typography>
      <Typography variant="body2">
        <strong>Warehouse Rate:</strong> {values.warehouse_rate}
      </Typography>
      <Typography variant="body2">
        <strong>Location ID:</strong> {values.location_id}
      </Typography>
      <Typography variant="body2">
        <strong>Warehouse IDs:</strong>{" "}
        {values.warehouse_ids && values.warehouse_ids.length > 0
          ? values.warehouse_ids.map((id) => (
              <Chip key={id} label={id} size="small" sx={{ mr: 0.5 }} />
            ))
          : "None"}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status_id)}
      </Typography>
    </Box>
  );
};

export default StoreRateReviewStep;
