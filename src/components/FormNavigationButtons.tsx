// src/components/FormNavigationButtons.tsx
import React from "react";
import { Box, CircularProgress } from "@mui/material";
import ActionButton from "./ActionButton"; // Adjust path as needed

// Define the interface for FormNavigationButtons's props
interface FormNavigationButtonsProps {
  activeStep: number;
  totalSteps: number;
  isSubmittingFormik: boolean;
  isEditMode: boolean;
  onBackClick: () => void;
  onNextClick: () => void;
}

const FormNavigationButtons: React.FC<FormNavigationButtonsProps> = ({
  activeStep,
  totalSteps,
  isSubmittingFormik,
  isEditMode,
  onBackClick,
  onNextClick,
}) => {
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
      <Box sx={{ flex: "1 1 auto" }} />

      {activeStep > 0 && (
        <ActionButton
          onClick={onBackClick}
          text="Previous"
          variant="outlined"
          color="secondary"
          sx={{ mr: 1 }}
        />
      )}

      <ActionButton
        onClick={onNextClick}
        text={isLastStep ? (isEditMode ? "Update" : "Save") : "Next"}
        color="secondary"
        disabled={isSubmittingFormik}
      >
        {isSubmittingFormik && <CircularProgress size={24} color="inherit" />}
      </ActionButton>
    </Box>
  );
};

export default FormNavigationButtons;
