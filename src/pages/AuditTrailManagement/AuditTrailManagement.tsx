import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions, {
  DataGridAction,
} from "../../components/DatagridActions";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import { AuditTrailLog } from "../../types/AuditTrailTypes";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import { DynamicColumnConfig } from "@/types/columnConfig";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "service", headerName: "Service", flex: 1 },
  { field: "method", headerName: "Method", flex: 1 },
  { field: "description", headerName: "Description", flex: 2 },
  //   {
  //     field: "status_name",
  //     headerName: "Status",
  //     flex: 0.8,
  //     renderer: "statusName",
  //   },
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

const mobileHiddenFields = ["created_user", "created_at"];
const nonMobileHiddenFields = [""];

const AuditTrailManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dataRows, setDataRows] = useState<AuditTrailLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get } = apiInstance;

  // Permission context
  const { canViewModule, loading: permissionsLoading } = useUserPermissions();
  const hasViewPermission = canViewModule("audit_trail");

  const loadAuditTrailData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<{ data: AuditTrailLog[] }>(
        "/user-audit-trail"
      );
      if (response) {
        const logs = Array.isArray(response) ? response : response.data;
        setDataRows(
          logs.map((log: AuditTrailLog) => ({
            ...log,
            id: log.id,
            service: log.service || "",
            method: log.method || "",
            description: log.description || "",
            status_name:
              log.status_name || (log.status_id === 1 ? "ACTIVE" : "INACTIVE"),
            created_user: log.created_user || "",
            created_at: log.created_at || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading audit trail:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadAuditTrailData();
  }, [loadAuditTrailData]);

  const handleView = useCallback(
    (id: string | number, rowData: AuditTrailLog) => {
      navigate(`/audit-trail/${id}`, { state: { auditLog: rowData } });
    },
    [navigate]
  );

  // Only view action
  const buttonActionGrid: DataGridAction<AuditTrailLog>[] = useMemo(
    () => [
      {
        type: "view",
        label: "View",
        icon: VisibilityIcon,
        onClick: handleView,
        tooltip: "View Audit Log",
        ariaLabel: "View Audit Log",
        permission: true, // Always show view
      },
    ],
    [handleView]
  );

  //   const columns: GridColDef<AuditTrailLog>[] = useMemo(
  //     () => [
  //       ...COLUMN_CONFIG,
  //       {
  //         field: "actions",
  //         headerName: "Actions",
  //         headerAlign: "center",
  //         flex: 1.2,
  //         sortable: false,
  //         filterable: false,
  //         renderCell: (params: GridRenderCellParams<AuditTrailLog>) => {
  //           if (!params.row) return null;
  //           const id = params.row.id;
  //           const rowData = params.row;
  //           return (
  //             <DatagridActions<AuditTrailLog>
  //               rowId={id}
  //               actions={buttonActionGrid}
  //               rowData={rowData}
  //             />
  //           );
  //         },
  //       },
  //     ],
  //     [buttonActionGrid]
  //   );

  const columns: GridColDef<AuditTrailLog>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<AuditTrailLog>(COLUMN_CONFIG);

    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<AuditTrailLog>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<AuditTrailLog>
              rowId={id}
              actions={buttonActionGrid}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [buttonActionGrid]);

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Audit Trail" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header title="AUDIT TRAIL" subtitle="View user audit logs" />
      <CustomDataGrid<AuditTrailLog>
        rows={dataRows}
        columns={columns}
        checkboxSelection={false}
        getRowId={(row: AuditTrailLog) => row.id}
        initialMobileHiddenFields={mobileHiddenFields}
        initialNonMobileHiddenFields={nonMobileHiddenFields}
      />
    </Box>
  );
};

export default AuditTrailManagement;
