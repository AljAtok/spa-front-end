// src/components/FormStepper.tsx
import {
  Stepper,
  Step,
  StepLabel,
  useTheme,
  SxProps,
  Theme,
} from "@mui/material";
import { tokens } from "../styles/theme"; // Assuming `tokens` is correctly defined and exported from ../theme
import { FormStep } from "../types/formTypes"; // Import FormStep interface

// Define the interface for FormStepper's props
// It also takes a generic type TFormValues because FormStep is generic
interface FormStepperProps<TFormValues extends object> {
  activeStep: number;
  steps: FormStep<TFormValues>[]; // Use the FormStep type defined earlier
  alternativeLabel?: boolean; // Optional prop
  sx?: SxProps<Theme>; // Allow custom SX styles
}

const FormStepper = <TFormValues extends object>({
  activeStep,
  steps,
  alternativeLabel = true,
  sx,
}: FormStepperProps<TFormValues>) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Stepper
      activeStep={activeStep}
      alternativeLabel={alternativeLabel}
      sx={{
        mt: 2,
        mb: 4,
        "& .MuiStepLabel-root": {
          "&.Mui-active": {
            color: colors.primary[100], // Example: Active step label color
            fontWeight: "bold",
          },
          "&.Mui-completed": {
            color: colors.primary[100], // Example: Completed step label color
          },
        },
        "& .MuiStepIcon-root": {
          color: colors.grey[700], // Default inactive icon color
          "&.Mui-active": {
            color: colors.greenAccent[500], // Example: Active icon color
          },
          "&.Mui-completed": {
            color: colors.greenAccent[500], // Example: Completed icon color
          },
        },
        "& .MuiStepConnector-line": {
          borderColor: colors.grey[700], // Example: Connector line color
        },
        // Spread any additional sx props passed from the parent
        ...sx,
      }}
    >
      {steps.map((step) => (
        <Step key={step.id}>
          <StepLabel>{step.title}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default FormStepper;
