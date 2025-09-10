import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Transaction } from "@/types/TransactionTypes";
import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomDataGrid from "@/components/CustomDataGrid";
import PageLoader from "@/components/PageLoader";
import DatagridActions, { DataGridAction } from "@/components/DatagridActions";
import NotAuthorized from "@/pages/NotAuthorized/NotAuthorized";
import ConfirmationDialog from "@/components/ConfirmDialog";
import TransactionActionDialog from "@/components/TransactionActionDialog";
import {
  fetchTransactions,
  postTransaction,
  cancelTransaction,
  revertTransaction,
} from "@/api/transactionApi";
import HeaderActionButton from "@/components/HeaderActionButton";
import { Header } from "@/components/Header";
import { DynamicColumnConfig } from "@/types/columnConfig";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import {
  Lock,
  Cancel,
  Undo,
  Edit,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import ReusableTabs, { TabConfig } from "../../components/ReusableTabs";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  //   { field: "trans_id", headerName: "Trans ID", width: 100 },
  { field: "trans_number", headerName: "Trans. #", width: 100 },
  { field: "location_name", headerName: "Location", flex: 1 },
  {
    field: "trans_date",
    headerName: "Month",
    flex: 1,
    renderer: "date",
    dateFieldKey: "trans_date",
    format: "MMMM YYYY", // or any supported format
  },
  {
    field: "status_name",
    headerName: "Status",
    flex: 1,
    renderer: "statusName",
  },
  { field: "entries", headerName: "Entries", width: 100 },
  {
    field: "total_sales",
    headerName: "Total Sales Qty",
    width: 120,
    type: "number",
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

const mobileHiddenFields = ["created_user", "created_at", "entries"];
const nonMobileHiddenFields = [""];

const TransactionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const defTabIndex = state?.currentTabIndex;
  const [dataRows, setDataRows] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch } = apiInstance;
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "post" | "cancel" | "revert" | null
  >(null);
  const [transactionToAction, setTransactionToAction] =
    useState<Transaction | null>(null);

  // Permission context
  const {
    canViewModule,
    canEditInModule,
    canPostInModule,
    canCancelInModule,
    canRevertInModule,
    loading: permissionsLoading,
  } = useUserPermissions();
  const hasViewPermission = canViewModule("incentive-transactions");
  const hasEditPermission = canEditInModule("incentive-transactions");
  const hasPostPermission = canPostInModule("incentive-transactions");
  const hasCancelPermission = canCancelInModule("incentive-transactions");
  const hasRevertPermission = canRevertInModule("incentive-transactions");
  const [currentTab, setCurrentTab] = useState<
    "pending" | "posted" | "cancelled"
  >("pending");
  const [currentTabIndex, setCurrentTabIndex] = useState<0 | 1 | 2>(
    defTabIndex as 0 | 1 | 2
  );

  const loadTransactionsData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetchTransactions({ get });
      setDataRows(response);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadTransactionsData();
  }, [loadTransactionsData]);

  const handleEdit = useCallback(
    (id: string | number, rowData: Transaction) => {
      console.log(`Edit transaction with ID:`, id, `Data:`, rowData);
      navigate("/transaction-form", {
        state: { transactionId: id, currentTabIndex: currentTabIndex },
      });
    },
    [navigate, currentTabIndex]
  );

  const handleView = useCallback(
    (id: string | number, rowData: Transaction) => {
      console.log(`View transaction with ID:`, id, `Data:`, rowData);
      navigate("/transaction-view", {
        state: {
          transactionId: id,
          transactionNumber: rowData.trans_number,
          currentTabIndex: currentTabIndex,
        },
      });
    },
    [navigate, currentTabIndex]
  );

  const handlePost = useCallback(
    (id: string | number, rowData: Transaction) => {
      console.log(`Post transaction with ID:`, id, `Data:`, rowData);
      setTransactionToAction(rowData);
      setActionType("post");
      setOpenActionDialog(true);
    },
    []
  );

  const handleCancel = useCallback(
    (id: string | number, rowData: Transaction) => {
      console.log(`Cancel transaction with ID:`, id, `Data:`, rowData);
      setTransactionToAction(rowData);
      setActionType("cancel");
      setOpenReasonDialog(true);
    },
    []
  );

  const handleRevert = useCallback(
    (id: string | number, rowData: Transaction) => {
      console.log(`Revert transaction with ID:`, id, `Data:`, rowData);
      setTransactionToAction(rowData);
      setActionType("revert");
      setOpenReasonDialog(true);
    },
    []
  );

  const handleNew = useCallback(() => {
    navigate("/transaction-form", {
      state: { currentTabIndex: currentTabIndex },
    });
  }, [navigate, currentTabIndex]);

  const handleCloseActionDialog = useCallback(() => {
    setOpenActionDialog(false);
    setTransactionToAction(null);
    setActionType(null);
  }, []);

  const handleCloseReasonDialog = useCallback(() => {
    setOpenReasonDialog(false);
    setTransactionToAction(null);
    setActionType(null);
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (transactionToAction && actionType === "post") {
      try {
        const id = transactionToAction.trans_id.toString();
        await postTransaction({ patch }, id);
        await loadTransactionsData();
        setOpenActionDialog(false);
        setTransactionToAction(null);
        setActionType(null);
        setCurrentTabIndex(currentTabIndex);
      } catch (error) {
        console.error(`Error performing ${actionType} action:`, error);
      }
    }
  }, [
    transactionToAction,
    actionType,
    loadTransactionsData,
    patch,
    currentTabIndex,
  ]);

  const handleConfirmActionWithReason = useCallback(
    async (reason: string) => {
      if (transactionToAction && actionType) {
        try {
          const id = transactionToAction.trans_id.toString();
          switch (actionType) {
            case "cancel":
              await cancelTransaction({ patch }, id, reason);
              break;
            case "revert":
              await revertTransaction({ patch }, id, reason);
              break;
          }
          await loadTransactionsData();
          setOpenReasonDialog(false);
          setTransactionToAction(null);
          setActionType(null);
          setCurrentTabIndex(currentTabIndex);
        } catch (error) {
          console.error(`Error performing ${actionType} action:`, error);
        }
      }
    },
    [
      transactionToAction,
      actionType,
      loadTransactionsData,
      patch,
      currentTabIndex,
    ]
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newTabIndex: number) => {
      // Map tab index to tab key
      const tabKeys: ("pending" | "cancelled" | "posted")[] = [
        "pending",
        "posted",
        "cancelled",
      ];
      const newTab = tabKeys[newTabIndex] || "pending";
      console.log(`Tab changed to: ${newTab} (index: ${newTabIndex})`);

      setCurrentTab(newTab);
      setCurrentTabIndex(newTabIndex as 0 | 1 | 2);
    },
    []
  );

  console.log(`Current tab : ${currentTab}`);

  // Custom action buttons based on status
  const getActionButtons = useCallback(
    (row: Transaction): DataGridAction<Transaction>[] => {
      const actions: DataGridAction<Transaction>[] = [];

      switch (row.status_id) {
        case 3: // PENDING
          // Edit button - only if user has edit permission
          if (hasEditPermission) {
            actions.push({
              type: "edit",
              tooltip: "Edit Transaction",
              icon: Edit,
              onClick: handleEdit,
              color: "primary",
              ariaLabel: "edit",
            });
          }

          // Post button - only if user has post permission
          if (hasPostPermission) {
            actions.push({
              type: "post",
              tooltip: "Post Transaction",
              icon: Lock,
              onClick: handlePost,
              color: "success",
              ariaLabel: "post",
            });
          }

          // Cancel button - only if user has cancel permission
          if (hasCancelPermission) {
            actions.push({
              type: "cancel",
              tooltip: "Cancel Transaction",
              icon: Cancel,
              onClick: handleCancel,
              color: "error",
              ariaLabel: "cancel",
            });
          }
          break;
        case 4: // POSTED
          // View button - always available if user has view permission (already checked at component level)
          actions.push({
            type: "view",
            tooltip: "View Transaction",
            icon: ReceiptLongOutlined,
            onClick: handleView,
            color: "primary",
            ariaLabel: "view",
          });

          // Cancel button - only if user has cancel permission
          if (hasCancelPermission) {
            actions.push({
              type: "cancel",
              tooltip: "Cancel Transaction",
              icon: Cancel,
              onClick: handleCancel,
              color: "error",
              ariaLabel: "cancel",
            });
          }

          // Revert button - only if user has revert permission
          if (hasRevertPermission) {
            actions.push({
              type: "revert",
              tooltip: "Revert Transaction",
              icon: Undo,
              onClick: handleRevert,
              color: "warning",
              ariaLabel: "revert",
            });
          }
          break;
        case 5: // CANCELLED
          // View button - always available if user has view permission (already checked at component level)
          actions.push({
            type: "view",
            tooltip: "View Transaction",
            icon: ReceiptLongOutlined,
            onClick: handleView,
            color: "primary",
            ariaLabel: "view",
          });

          // Revert button - only if user has revert permission
          if (hasRevertPermission) {
            actions.push({
              type: "revert",
              tooltip: "Revert Transaction",
              icon: Undo,
              onClick: handleRevert,
              color: "warning",
              ariaLabel: "revert",
            });
          }
          break;
        default:
          // No actions for unknown status
          break;
      }

      return actions;
    },
    [
      hasEditPermission,
      hasPostPermission,
      hasCancelPermission,
      hasRevertPermission,
      handleEdit,
      handleView,
      handlePost,
      handleCancel,
      handleRevert,
    ]
  );

  const columns: GridColDef<Transaction>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<Transaction>(COLUMN_CONFIG);
    return [
      ...generatedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Transaction>) => {
          if (!params.row) return null;
          const rowData = params.row;
          const actions = getActionButtons(rowData);
          return (
            <DatagridActions<Transaction>
              rowId={params.row.trans_id}
              actions={actions}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [getActionButtons]);

  const dialogMessage = useMemo(() => {
    if (!transactionToAction || !actionType) return null;

    const actionText = {
      post: "post",
      cancel: "cancel",
      revert: "revert",
    }[actionType];

    return (
      <>
        Are you sure you want to {actionText} Transaction "
        <strong>#{transactionToAction.trans_number}</strong>"? This action
        cannot be undone.
      </>
    );
  }, [transactionToAction, actionType]);

  const reasonDialogMessage = useMemo(() => {
    if (!transactionToAction || !actionType || actionType === "post")
      return null;

    const actionText = {
      cancel: "cancel",
      revert: "revert",
    }[actionType];

    return (
      <>
        Are you sure you want to {actionText} Transaction "
        <strong>#{transactionToAction.trans_number}</strong>"? This action
        cannot be undone.
      </>
    );
  }, [transactionToAction, actionType]);

  const dialogTitle = useMemo(() => {
    if (!actionType) return "";
    return {
      post: "Post Transaction",
      cancel: "Cancel Transaction",
      revert: "Revert Transaction",
    }[actionType];
  }, [actionType]);

  const reasonDialogConfig = useMemo(() => {
    if (!actionType) return null;

    const config = {
      cancel: {
        label: "Cancel Reason",
        placeholder:
          "Please provide a reason for canceling this transaction...",
        confirmText: "Cancel Transaction",
        color: "error" as const,
      },
      revert: {
        label: "Revert Reason",
        placeholder:
          "Please provide a reason for reverting this transaction...",
        confirmText: "Revert Transaction",
        color: "warning" as const,
      },
    };

    return config[actionType as keyof typeof config] || null;
  }, [actionType]);

  // Filter dataRows by status_id
  const pendingRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 3),
    [dataRows]
  );
  const postedRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 4),
    [dataRows]
  );
  const cancelledRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 5),
    [dataRows]
  );

  const tabs: TabConfig[] = [
    {
      label: "Pending",
      content: (
        <Box>
          <CustomDataGrid<Transaction>
            key="pending-trans-datagrid"
            rows={pendingRows}
            columns={columns}
            getRowId={(row: Transaction) => row.trans_id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
          />
        </Box>
      ),
    },
    {
      label: "Posted",
      content: (
        <Box>
          <CustomDataGrid<Transaction>
            key="posted-trans-datagrid"
            rows={postedRows}
            columns={columns}
            getRowId={(row: Transaction) => row.trans_id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
          />
        </Box>
      ),
    },
    {
      label: "Cancelled",
      content: (
        <Box>
          <CustomDataGrid<Transaction>
            key="cancelled-trans-datagrid"
            rows={cancelledRows}
            columns={columns}
            getRowId={(row: Transaction) => row.trans_id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
          />
        </Box>
      ),
    },
  ];

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="incentive-transactions" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="TRANSACTION MANAGEMENT"
        subtitle="Manage transactions"
        actionButton={
          <HeaderActionButton
            moduleAlias="incentive-transactions"
            onClick={handleNew}
          />
        }
      />
      <ReusableTabs
        value={currentTabIndex}
        tabs={tabs}
        onChange={handleTabChange}
      />
      <ConfirmationDialog
        open={openActionDialog}
        onClose={handleCloseActionDialog}
        onConfirm={handleConfirmAction}
        message={dialogMessage}
        title={dialogTitle}
      />
      <TransactionActionDialog
        open={openReasonDialog}
        onClose={handleCloseReasonDialog}
        onConfirm={handleConfirmActionWithReason}
        message={reasonDialogMessage}
        title={dialogTitle}
        reasonLabel={reasonDialogConfig?.label || "Reason"}
        reasonPlaceholder={reasonDialogConfig?.placeholder || "Enter reason..."}
        confirmButtonText={reasonDialogConfig?.confirmText || "Confirm"}
        confirmButtonColor={reasonDialogConfig?.color || "secondary"}
        required={true}
      />
    </Box>
  );
};

export default TransactionManagement;
