import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { CompanyFormValues } from "@/types/CompanyTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import {
  fetchCompanyById,
  createCompany,
  updateCompany,
} from "@/api/companyApi";
import PermissionGuard from "@/components/PermissionGuard";

// Status options for radio buttons
const companyStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Company Details Step Component
const CompanyDetailsStep: React.FC<
  StepComponentProps<CompanyFormValues>
> = () => {
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
        label="Company Name"
        name="company_name"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Company Abbreviation"
        name="company_abbr"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={companyStatusOptions}
        required
      />
    </Box>
  );
};

// Review Step Component
const ReviewCompanyStep: React.FC<StepComponentProps<CompanyFormValues>> = ({
  values,
}) => {
  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      companyStatusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Company Details
      </Typography>

      <Typography variant="body2">
        <strong>Company Name:</strong> {values.company_name}
      </Typography>
      <Typography variant="body2">
        <strong>Company Abbreviation:</strong> {values.company_abbr}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status as 1 | 2)}
      </Typography>
    </Box>
  );
};

const CompanyForm: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyFormValues | null>(
    null
  );
  const [loadingCompanyData, setLoadingCompanyData] = useState<boolean>(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const companyId = state?.companyId;
  const isEditMode = Boolean(companyId);
  const formHeaderTitle = isEditMode ? "Edit Company" : "Add Company";

  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadCompanyData = useCallback(async () => {
    if (isEditMode && companyId) {
      setLoadingCompanyData(true);
      try {
        const data = await fetchCompanyById({ get }, companyId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setCompanyData({
            company_name: data.company_name || "",
            company_abbr: data.company_abbr || "",
            status: mappedStatus,
          });
        } else {
          console.warn(`Company with ID ${companyId} not found.`);
          navigate("/companies", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load company details"
        );
        console.error("Error loading company:", error, errorMessage);
        navigate("/companies", { replace: true });
      } finally {
        setLoadingCompanyData(false);
      }
    } else {
      setLoadingCompanyData(false);
    }
  }, [isEditMode, companyId, navigate, get]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const stepsConfig: FormStep<CompanyFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Company Details",
        component: CompanyDetailsStep,
        fields: ["company_name", "company_abbr", "status"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewCompanyStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: CompanyFormValues = useMemo(() => {
    const defaultValues: CompanyFormValues = {
      company_name: "",
      company_abbr: "",
      status: 1,
    };

    if (isEditMode && companyData) {
      return {
        company_name: companyData.company_name,
        company_abbr: companyData.company_abbr,
        status: companyData.status,
      };
    }

    return defaultValues;
  }, [isEditMode, companyData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      company_name: Yup.string()
        .required("Company Name is required")
        .min(2, "Company Name must be at least 2 characters")
        .max(100, "Company Name must not exceed 100 characters"),
      company_abbr: Yup.string()
        .required("Company Abbreviation is required")
        .min(2, "Company Abbreviation must be at least 2 characters")
        .max(10, "Company Abbreviation must not exceed 10 characters"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: CompanyFormValues,
    formikHelpers: FormikHelpers<CompanyFormValues>
  ) => {
    try {
      // const apiPayload: CompanyFormValues = {
      //   company_name: values.company_name,
      //   company_abbr: values.company_abbr,
      //   status: +values.status as 1 | 2,
      // };
      if (isEditMode && companyId) {
        console.log("Submitting updated Company:", values, "ID:", companyId);
        await updateCompany({ put }, companyId, values);
      } else {
        console.log("Submitting new Company:", values);
        await createCompany({ post }, values);
      }
      formikHelpers.resetForm();
      navigate("/companies", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save company");
      console.error("Error saving company:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/companies");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="companies"
      isEditMode={isEditMode}
      loadingText="Company Form"
    >
      <MultiStepForm<CompanyFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingCompanyData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/companies"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Companies List"
      />
    </PermissionGuard>
  );
};

export default CompanyForm;
