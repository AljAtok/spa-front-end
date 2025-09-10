import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import InputTextField from "@/components/InputTextField";
import InputSelectField from "@/components/InputSelectField";
import InputRadioGroupField from "@/components/InputRadioGroupField";
import { AccessKeyFormValues } from "@/types/AccessKeyTypes";
import { Company } from "@/types/CompanyTypes";
import MultiStepForm from "@/components/MultiStepForm";
import { FormStep, StepComponentProps, RadioOption } from "@/types/formTypes";
import {
  fetchAccessKeyById,
  createAccessKey,
  updateAccessKey,
} from "@/api/accessKeyApi";
import { fetchAllCompanies } from "@/api/companyApi";
import PermissionGuard from "@/components/PermissionGuard";

// Status options for radio buttons
const accessKeyStatusOptions: RadioOption<1 | 2>[] = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

// Access Key Details Step Component
const AccessKeyDetailsStep: React.FC<
  StepComponentProps<AccessKeyFormValues>
> = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const apiInstance = useApi();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await fetchAllCompanies({ get: apiInstance.get });
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    };

    loadCompanies();
  }, [apiInstance.get]);

  const companyOptions = useMemo(() => {
    return companies
      .filter((company) => company.status_id === 1) // Only show active companies
      .map((company) => ({
        value: company.id,
        label: company.company_name,
      }));
  }, [companies]);

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
        label="Access Key Name"
        name="access_key_name"
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputTextField
        fullWidth
        variant="filled"
        type="text"
        label="Access Key Abbreviation"
        name="access_key_abbr"
        required
        sx={{ gridColumn: "span 4" }}
      />{" "}
      <InputSelectField
        fullWidth
        variant="filled"
        label="Company"
        name="company_id"
        options={companyOptions}
        required
        sx={{ gridColumn: "span 4" }}
      />
      <InputRadioGroupField<1 | 2>
        name="status"
        label="Status"
        options={accessKeyStatusOptions}
        required
      />
    </Box>
  );
};

// Review Step Component
const ReviewAccessKeyStep: React.FC<
  StepComponentProps<AccessKeyFormValues>
> = ({ values }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const apiInstance = useApi();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await fetchAllCompanies({ get: apiInstance.get });
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    };

    loadCompanies();
  }, [apiInstance.get]);

  // Helper to display status more readably
  const getStatusLabel = (statusCode: 1 | 2) => {
    return (
      accessKeyStatusOptions.find((opt) => opt.value === statusCode)?.label ||
      `Unknown Status (${statusCode})`
    );
  };

  // Helper to get company name
  const getCompanyName = (companyId: number) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.company_name : `Company ID: ${companyId}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Access Key Details
      </Typography>

      <Typography variant="body2">
        <strong>Access Key Name:</strong> {values.access_key_name}
      </Typography>
      <Typography variant="body2">
        <strong>Access Key Abbreviation:</strong> {values.access_key_abbr}
      </Typography>
      <Typography variant="body2">
        <strong>Company:</strong> {getCompanyName(values.company_id)}
      </Typography>
      <Typography variant="body2">
        <strong>Status:</strong> {getStatusLabel(values.status as 1 | 2)}
      </Typography>
    </Box>
  );
};

const AccessKeyForm: React.FC = () => {
  const [accessKeyData, setAccessKeyData] =
    useState<AccessKeyFormValues | null>(null);
  const [loadingAccessKeyData, setLoadingAccessKeyData] =
    useState<boolean>(true);

  const navigate = useNavigate();
  const { state } = useLocation();
  const accessKeyId = state?.accessKeyId;
  const isEditMode = Boolean(accessKeyId);
  const formHeaderTitle = isEditMode ? "Edit Access Key" : "Add Access Key";

  const apiInstance = useApi();
  const { get, post, put } = useMemo(
    () => ({
      get: apiInstance.get,
      post: apiInstance.post,
      put: apiInstance.put,
    }),
    [apiInstance]
  );

  const loadAccessKeyData = useCallback(async () => {
    if (isEditMode && accessKeyId) {
      setLoadingAccessKeyData(true);
      try {
        const data = await fetchAccessKeyById({ get }, accessKeyId);
        if (data) {
          // Convert API data to form values
          const mappedStatus: 1 | 2 =
            data.status_id === 1 || data.status_id === 2 ? data.status_id : 1;

          setAccessKeyData({
            access_key_name: data.access_key_name || "",
            access_key_abbr: data.access_key_abbr || "",
            company_id: data.company_id || 0,
            status: mappedStatus,
          });
        } else {
          console.warn(`Access Key with ID ${accessKeyId} not found.`);
          navigate("/access-keys", { replace: true });
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to load access key details"
        );
        console.error("Error loading access key:", error, errorMessage);
        navigate("/access-keys", { replace: true });
      } finally {
        setLoadingAccessKeyData(false);
      }
    } else {
      setLoadingAccessKeyData(false);
    }
  }, [isEditMode, accessKeyId, navigate, get]);

  useEffect(() => {
    loadAccessKeyData();
  }, [loadAccessKeyData]);

  const stepsConfig: FormStep<AccessKeyFormValues>[] = useMemo(
    () => [
      {
        id: "details",
        title: "Access Key Details",
        component: AccessKeyDetailsStep,
        fields: ["access_key_name", "access_key_abbr", "company_id", "status"],
      },
      {
        id: "review",
        title: "Review",
        component: ReviewAccessKeyStep,
        fields: [],
      },
    ],
    []
  );

  const initialValues: AccessKeyFormValues = useMemo(() => {
    const defaultValues: AccessKeyFormValues = {
      access_key_name: "",
      access_key_abbr: "",
      company_id: 0,
      status: 1,
    };

    if (isEditMode && accessKeyData) {
      return {
        access_key_name: accessKeyData.access_key_name,
        access_key_abbr: accessKeyData.access_key_abbr,
        company_id: accessKeyData.company_id,
        status: accessKeyData.status,
      };
    }

    return defaultValues;
  }, [isEditMode, accessKeyData]);

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      access_key_name: Yup.string()
        .required("Access Key Name is required")
        .min(2, "Access Key Name must be at least 2 characters")
        .max(100, "Access Key Name must not exceed 100 characters"),
      access_key_abbr: Yup.string()
        .required("Access Key Abbreviation is required")
        .min(2, "Access Key Abbreviation must be at least 2 characters")
        .max(10, "Access Key Abbreviation must not exceed 10 characters"),
      company_id: Yup.number()
        .required("Company is required")
        .min(1, "Please select a company"),
      status: Yup.number<1 | 2>()
        .oneOf([1, 2], "Invalid Status")
        .required("Status is required"),
    });
  }, []);

  const handleSubmit = async (
    values: AccessKeyFormValues,
    formikHelpers: FormikHelpers<AccessKeyFormValues>
  ) => {
    try {
      // const apiPayload: AccessKeyFormValues = {
      //   access_key_name: values.access_key_name,
      //   access_key_abbr: values.access_key_abbr,
      //   company_id: values.company_id,
      //   status: +values.status as 1 | 2, // Ensure proper type
      // };
      if (isEditMode && accessKeyId) {
        console.log(
          "Submitting updated Access Key:",
          values,
          "ID:",
          accessKeyId
        );
        await updateAccessKey({ put }, accessKeyId, values);
      } else {
        console.log("Submitting new Access Key:", values);
        await createAccessKey({ post }, values);
      }
      formikHelpers.resetForm();
      navigate("/access-keys", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save access key");
      console.error("Error saving access key:", error, errorMessage);
      throw error;
    }
  };

  const handleHeaderBackClick = useCallback(() => {
    navigate("/access-keys");
  }, [navigate]);

  return (
    <PermissionGuard
      moduleAlias="access-keys"
      isEditMode={isEditMode}
      loadingText="Access Keys"
    >
      <MultiStepForm<AccessKeyFormValues>
        formHeaderTitle={formHeaderTitle}
        initialValues={initialValues}
        validationSchema={validationSchema}
        stepsConfig={stepsConfig}
        onSubmit={handleSubmit}
        isLoadingInitialData={loadingAccessKeyData}
        isEditMode={isEditMode}
        redirectPathAfterSubmit="/access-keys"
        onHeaderBackClick={handleHeaderBackClick}
        headerActionButtonText="Back to Access Keys List"
      />
    </PermissionGuard>
  );
};

export default AccessKeyForm;
