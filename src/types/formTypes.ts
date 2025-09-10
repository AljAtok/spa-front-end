// src/types/formTypes.ts (or directly in MultiStepForm.tsx if it's the only place used)
import { ComponentType } from "react";
import { FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";

export interface RadioOption<TValue> {
  label: string;
  value: TValue;
}

// Type for a single step's component (which receives FormikProps)
export interface StepComponentProps<TFormValues> {
  values: TFormValues;
  formikProps: FormikProps<TFormValues>;
}

// Type for a single step's configuration
export interface FormStep<TFormValues> {
  id: string | number;
  title: string;
  // A component that takes StepComponentProps
  component: ComponentType<StepComponentProps<TFormValues>>;
  fields: (keyof TFormValues)[]; // Array of field names relevant for this step's validation
}

// Type for the overall MultiStepForm component props
export interface MultiStepFormProps<TFormValues extends object> {
  formHeaderTitle: string;
  initialValues: TFormValues;
  validationSchema: Yup.ObjectSchema<TFormValues>; // Combined Yup schema for the entire form
  stepsConfig: FormStep<TFormValues>[]; // Array of step configurations
  onSubmit: (
    values: TFormValues,
    formikHelpers: FormikHelpers<TFormValues>
  ) => Promise<void>;
  isEditMode?: boolean; // Controls 'Add' vs 'Update' text
  isLoadingInitialData?: boolean; // For showing loader while initial data loads
  onHeaderBackClick?: () => void; // Function for the top-left 'Back' button in the header
  redirectPathAfterSubmit?: string; // Path to navigate after successful form submission
  headerActionButtonText?: string;
  navOptions?: { replace?: boolean }; // Options for useNavigate (e.g., replace: true)
  // add more props for default styling or custom components if needed
  // headerActionButtonIcon?: React.ReactNode;
  // boxSx?: SxProps<Theme>;
}
