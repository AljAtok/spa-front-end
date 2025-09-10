import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import {
  fetchAllCompanies,
  toggleCompanyStatusActivate,
  toggleCompanyStatusDeactivate,
} from "../../api/companyApi";
import { Company } from "../../types/CompanyTypes";
import { useApi } from "@/hooks/useApi";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";

import { DynamicColumnConfig } from "../../types/columnConfig";
import { mapColumnConfigToGridColDef } from "../../utils/columnMapper";

import ConfirmationDialog from "@/components/ConfirmDialog";
import { useActionButtonsGuard } from "../../hooks/useActionButtonsGuard";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "company_name",
    headerName: "Company Name",
    flex: 1.5,
    cellClassName: "name-column--cell",
  },
  {
    field: "company_abbr",
    headerName: "Abbreviation",
    flex: 1,
  },
  {
    field: "status_name",
    headerName: "Status",
    flex: 0.8,
    renderer: "statusName",
  },
  {
    field: "created_user",
    headerName: "Created By",
    flex: 1,
    renderer: "createdUser",
  },
  {
    field: "created_at",
    headerName: "Created At",
    flex: 1,
    renderer: "dateTime",
    dateFieldKey: "created_at",
  },
];

const mobileHiddenCompanyFields = ["created_user", "created_at"];
const nonMobileHiddenCompanyFields = [""];

const CompanyManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("companies");

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [companyToToggleStatus, setCompanyToToggleStatus] =
    useState<Company | null>(null);

  const loadCompaniesData = useCallback(async () => {
    setLoadingData(true);
    try {
      const companies = await fetchAllCompanies({ get });
      setDataRows(
        companies.map((company) => ({
          ...company,
          id: company.id,
          company_name: company.company_name || "",
          company_abbr: company.company_abbr || "",
          status_name:
            company.status_name ||
            (company.status_id === 1 ? "ACTIVE" : "INACTIVE"),
          created_user: company.created_user || "",
          created_at: company.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadCompaniesData();
  }, [loadCompaniesData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Company) => {
      console.log(`Edit Company with ID:`, id, `Data:`, rowData);
      navigate("/company-form", { state: { companyId: id } });
    },
    [navigate]
  );

  const handleToggleStatus = useCallback(
    (id: string | number, rowData: Company) => {
      console.log(`Preparing to toggle status with ID:`, id, `Data:`, rowData);
      setCompanyToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setCompanyToToggleStatus(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (companyToToggleStatus) {
      try {
        const newStatusId = companyToToggleStatus.status_id === 1 ? 2 : 1;
        const toggleFunction =
          newStatusId === 2
            ? toggleCompanyStatusDeactivate
            : toggleCompanyStatusActivate;

        await toggleFunction(
          { patch },
          companyToToggleStatus.id.toString(),
          newStatusId,
          companyToToggleStatus.company_name
        );
        await loadCompaniesData();
        setOpenToggleStatusDialog(false);
        setCompanyToToggleStatus(null);
      } catch (error) {
        console.error("Error toggling company status:", error);
      }
    }
  }, [companyToToggleStatus, loadCompaniesData, patch]);

  const handleNew = useCallback(() => {
    console.log("Add New Company");
    navigate("/company-form");
  }, [navigate]);

  // Use ActionButtonsGuard hook for consistent permission-based action buttons
  const buttonActionGrid = useActionButtonsGuard({
    moduleAlias: "companies",
    editHandler: handleEdit,
    toggleStatusHandler: handleToggleStatus,
    editTooltip: "Edit Company",
    activateTooltip: "Activate Company",
    deactivateTooltip: "Deactivate Company",
  });

  const columns: GridColDef<Company>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<Company>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Company>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;

          return (
            <DatagridActions<Company>
              rowId={id}
              actions={buttonActionGrid.actions}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [buttonActionGrid]);

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {companyToToggleStatus?.status_id === 1
          ? " deactivate"
          : " activate"}{" "}
        Company "
        <strong>{companyToToggleStatus?.company_name || "this company"}</strong>
        "? This action cannot be undone.
      </>
    ),
    [companyToToggleStatus?.status_id, companyToToggleStatus?.company_name]
  );

  const dialogTitle = useMemo(
    () =>
      companyToToggleStatus?.status_id === 1 ? "Deactivation" : "Activation",
    [companyToToggleStatus?.status_id]
  );

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Companies" />;
  }

  // If user doesn't have view permission, show not authorized page
  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="COMPANIES MANAGEMENT"
        subtitle="Manage companies"
        actionButton={
          <HeaderActionButton moduleAlias="companies" onClick={handleNew} />
        }
      />
      <CustomDataGrid<Company>
        rows={dataRows}
        columns={columns}
        getRowId={(row: Company) => row.id}
        initialMobileHiddenFields={mobileHiddenCompanyFields}
        initialNonMobileHiddenFields={nonMobileHiddenCompanyFields}
      />

      <ConfirmationDialog
        open={openToggleStatusDialog}
        onClose={handleCloseToggleStatusDialog}
        onConfirm={handleConfirmToggleStatus}
        message={dialogMessage}
        title={dialogTitle}
      />
    </Box>
  );
};

export default CompanyManagement;
