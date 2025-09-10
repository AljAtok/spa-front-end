// src/components/MultiStepForm.tsx

import { useState, useMemo, useCallback } from "react";
import { Formik, Form, FormikProps, FormikTouched } from "formik";

import {
  Box,
  Button,
  Typography,
  //   CircularProgress,
  //   useTheme,
  //   SxProps, // For optional boxSx prop
  //   Theme, // For optional boxSx prop
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Reusable components (ensure paths are correct relative to this file)
import FormHeader from "./FormHeader";
import FormStepper from "./FormStepper";
import PageLoader from "./PageLoader";
import FormNavigationButtons from "./FormNavigationButtons";

// Import types from a central types file
import {
  MultiStepFormProps,
  FormStep,
  //   StepComponentProps,
} from "../types/formTypes";
// import { tokens } from "../theme"; // Uncomment if need tokens directly here

// --- MultiStepForm Component ---
const MultiStepForm = <TFormValues extends object>({
  formHeaderTitle,
  initialValues,
  validationSchema,
  stepsConfig,
  onSubmit,
  isEditMode = false,
  isLoadingInitialData = false,
  onHeaderBackClick,
  redirectPathAfterSubmit = "/",
  headerActionButtonText = "Back to List",
  navOptions = {},
}: // headerActionButtonIcon = <ArrowBackIcon />, // Default icon if needed
// boxSx = {} // Default empty object
MultiStepFormProps<TFormValues>) => {
  const navigate = useNavigate();
  //   const theme = useTheme(); // If FormStepper/FormHeader uses theme internally, this is good.
  // const colors = tokens(theme.palette.mode); // Uncomment if need tokens directly here

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmittingFormik, setIsSubmittingFormik] = useState(false); // Manages loading state for buttons

  // Determine current step and if it's the last step
  const currentStep: FormStep<TFormValues> = useMemo(
    () => stepsConfig[activeStep] || stepsConfig[0],
    [activeStep, stepsConfig]
  );
  const isLastStep = activeStep === stepsConfig.length - 1;
  const totalSteps = stepsConfig.length;

  // --- Validation and Navigation Logic (Next/Submit Button) ---
  const handleNext = useCallback(
    async (formikProps: FormikProps<TFormValues>) => {
      console.log(
        "handleNext called - Current step:",
        activeStep,
        "Step config:",
        currentStep
      );

      // 1. Manually set relevant fields as touched to display errors immediately.
      const newTouched: { [key: string]: boolean } = {};
      currentStep.fields.forEach((fieldName) => {
        newTouched[fieldName as string] = true; // Cast fieldName to string for object key
      });
      await formikProps.setTouched(
        newTouched as FormikTouched<TFormValues>,
        true
      );

      // 2. Trigger a full validation pass on the entire form.
      // This populates formikProps.errors.
      const errors = await formikProps.validateForm();
      console.log("Validation errors:", errors);
      console.log("Current step fields:", currentStep.fields);

      // 3. Check if any errors exist specifically for fields in the current step.
      let hasErrorsInCurrentStep = false;
      for (const fieldName of currentStep.fields) {
        if (errors[fieldName]) {
          console.log(
            `Validation error for field ${String(fieldName)}:`,
            errors[fieldName]
          );
          hasErrorsInCurrentStep = true;
          break;
        }
      }

      // 4. Conditionally proceed or submit.
      if (hasErrorsInCurrentStep) {
        console.log("Validation errors on current step:", errors);
        return; // Prevent proceeding if current step has errors
      }

      if (isLastStep) {
        console.log("Last step reached, submitting form");
        // If it's the last step and no current step errors, trigger Formik's onSubmit
        formikProps.submitForm();
      } else {
        console.log("Moving to next step");
        // Otherwise, move to the next step
        setActiveStep((prev) => prev + 1);
      }
    },
    [currentStep, isLastStep, activeStep]
  );

  // Function to handle the "Back" button within the navigation
  const handleStepBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  // --- Dynamic Next/Submit Button Content ---
  //   const primaryButtonContent = useMemo(() => {
  //     if (isSubmittingFormik) {
  //       return <CircularProgress size={24} color="inherit" />;
  //     }
  //     return isLastStep ? (isEditMode ? "Update" : "Add") : "Next";
  //   }, [isSubmittingFormik, isLastStep, isEditMode]);

  // --- Handle Loading Initial Data ---
  if (isLoadingInitialData) {
    return <PageLoader />;
  }

  return (
    <Box
      sx={{
        maxWidth: 1000,
        mx: "auto",
        mt: 1,
        p: 3,
        borderRadius: "8px",
        boxShadow: 0,
        // ...(boxSx || {}), // Uncomment to add boxSx prop
      }}
    >
      <FormHeader
        title={formHeaderTitle}
        actionButton={
          <Button
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={
              onHeaderBackClick ||
              (() => navigate(redirectPathAfterSubmit, navOptions))
            }
            sx={{ ml: 2 }}
          >
            {headerActionButtonText}
          </Button>
        }
      />

      <FormStepper activeStep={activeStep} steps={stepsConfig} />

      <Formik<TFormValues> // Specify the generic type for Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={async (values, formikHelpers) => {
          setIsSubmittingFormik(true);
          try {
            await onSubmit(values, formikHelpers);
            formikHelpers.resetForm();
            setActiveStep(0); // Reset to first step after successful submission
            navigate(redirectPathAfterSubmit, navOptions);
          } catch (error) {
            console.error("Form submission error:", error);
            // Consider showing a user-friendly error message (e.g., using a Snackbar/Toast)
            // alert("Submission failed. Please try again.");
          } finally {
            setIsSubmittingFormik(false);
            formikHelpers.setSubmitting(false); // Reset Formik's internal submitting state
          }
        }}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {(formikProps: FormikProps<TFormValues>) => (
          <Form>
            {/* Render the current step's component */}
            {currentStep.component ? (
              <currentStep.component
                values={formikProps.values}
                formikProps={formikProps}
              />
            ) : (
              <Typography color="error">
                No component defined for this step.
              </Typography>
            )}

            <FormNavigationButtons
              activeStep={activeStep}
              totalSteps={totalSteps}
              isSubmittingFormik={isSubmittingFormik}
              isEditMode={isEditMode} // Pass isEditMode
              onBackClick={handleStepBack}
              onNextClick={() => handleNext(formikProps)} // Pass formikProps directly
              // Removed primaryButtonContent as it's now computed internally by FormNavigationButtons
            />
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default MultiStepForm;
