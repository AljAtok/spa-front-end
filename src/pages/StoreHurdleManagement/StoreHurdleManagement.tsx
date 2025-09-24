import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";

import { useApi } from "@/hooks/useApi";
import { useUserPermissions } from "../../hooks/useUserPermissions";

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import CustomDataGrid from "../../components/CustomDataGrid";
import PageLoader from "../../components/PageLoader";
import DatagridActions, {
  DataGridAction,
} from "../../components/DatagridActions";
import HeaderActionButton from "../../components/HeaderActionButton";
import NotAuthorized from "../NotAuthorized/NotAuthorized";

import ConfirmationDialog from "@/components/ConfirmDialog";
import TransactionActionDialog from "@/components/TransactionActionDialog";
import { StoreHurdle } from "../../types/StoreHurdleTypes";
import { DynamicColumnConfig } from "@/types/columnConfig";
import { mapColumnConfigToGridColDef } from "@/utils/columnMapper";
import { GenericObjectArrayFieldRenderer } from "../../components/DataGridRenderers";
import UploadOutlinedIcon from "./UploadOutlinedIcon";
import ReusableTabs, { TabConfig } from "../../components/ReusableTabs";
import {
  Edit,
  ThumbUp,
  Schedule,
  Undo,
  Send,
  CheckCircle,
  RestoreFromTrash,
  History,
} from "@mui/icons-material";

import HurdleHistoryDialog from "../../components/HurdleHistoryDialog";

const COLUMN_CONFIG: DynamicColumnConfig[] = [
  //   { field: "id", headerName: "ID", width: 70 },
  { field: "location_name", headerName: "Location", flex: 1 },
  { field: "warehouse_ifs", headerName: "Store IFS", flex: 1 },
  { field: "warehouse_name", headerName: "Store Name", flex: 1.5 },
  //   { field: "warehouse_rate", headerName: "Rate", flex: 1 },
  { field: "ss_hurdle_qty", headerName: "Hurdle Qty", flex: 1 },
  {
    field: "hurdle_date",
    headerName: "Hurdle Month",
    flex: 1,
  },
  {
    field: "extension_categories",
    headerName: "Item Categories",
    flex: 1,
    renderer: "extensionCategoryCodes",
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

const mobileHiddenFields = [
  "created_user",
  "created_at",
  "status_name",
  "warehouse_name",
];
const nonMobileHiddenFields = ["status_name"];

interface StoreHurdleWithDisplay extends StoreHurdle {
  extension_categories_display: string;
}

// Bulk action buttons component - moved outside to ensure proper re-rendering
const BulkActionButtons = React.memo(
  ({
    statusId,
    hasEditPermission,
    hasApprovalPermission,
    hasRevertPermission,
    hasPostPermission,
    selectedRows,
    onBulkForApproval,
    onBulkApproved,
    onBulkBackToPending,
    loadingBulkForApproval,
    loadingBulkApproved,
    loadingBulkBackToPending,
  }: {
    statusId: number;
    hasEditPermission: boolean;
    hasApprovalPermission: boolean;
    hasRevertPermission: boolean;
    hasPostPermission: boolean;
    selectedRows: string[];
    onBulkForApproval: () => void;
    onBulkApproved: () => void;
    onBulkBackToPending: () => void;
    loadingBulkForApproval: boolean;
    loadingBulkApproved: boolean;
    loadingBulkBackToPending: boolean;
  }) => {
    console.log("BulkActionButtons render:", {
      statusId,
      selectedRows,
      hasEditPermission,
      length: selectedRows.length,
    });

    if (!selectedRows || selectedRows.length === 0) {
      console.log("No selected rows, returning null");
      return null;
    }

    const buttons = [];

    if (statusId === 3 && hasPostPermission) {
      // Pending tab

      buttons.push(
        <Button
          key="bulk-for-approval"
          variant="contained"
          color="warning"
          startIcon={
            loadingBulkForApproval ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Send />
            )
          }
          onClick={onBulkForApproval}
          disabled={loadingBulkForApproval}
          sx={{ mr: 1 }}
        >
          {loadingBulkForApproval
            ? "Sending..."
            : `Send ${selectedRows.length} for Approval`}
        </Button>
      );
    } else if (statusId === 6 && (hasApprovalPermission || hasPostPermission)) {
      // For Approval tab
      if (hasApprovalPermission) {
        buttons.push(
          <Button
            key="bulk-approved"
            variant="contained"
            color="success"
            startIcon={
              loadingBulkApproved ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircle />
              )
            }
            onClick={onBulkApproved}
            disabled={loadingBulkApproved}
            sx={{ mr: 1 }}
          >
            {loadingBulkApproved
              ? "Approving..."
              : `Approve ${selectedRows.length} Items`}
          </Button>
        );
      }

      if (hasPostPermission) {
        // For Approval tab
        buttons.push(
          <Button
            key="bulk-back-to-pending"
            variant="contained"
            color="warning"
            startIcon={
              loadingBulkBackToPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RestoreFromTrash />
              )
            }
            onClick={onBulkBackToPending}
            disabled={loadingBulkBackToPending}
            sx={{ mr: 1 }}
          >
            {loadingBulkBackToPending
              ? "Reverting..."
              : `Revert ${selectedRows.length} to Pending`}
          </Button>
        );
      }
    } else if (statusId === 7 && hasRevertPermission) {
      // Approved tab
      buttons.push(
        <Button
          key="bulk-back-to-pending"
          variant="contained"
          color="warning"
          startIcon={
            loadingBulkBackToPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RestoreFromTrash />
            )
          }
          onClick={onBulkBackToPending}
          disabled={loadingBulkBackToPending}
          sx={{ mr: 1 }}
        >
          {loadingBulkBackToPending
            ? "Reverting..."
            : `Revert ${selectedRows.length} to Pending`}
        </Button>
      );
    }

    return (
      <Box
        sx={{
          p: 0,
          display: "flex",
          justifyContent: "flex-end",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {buttons}
      </Box>
    );
  }
);

const StoreHurdleManagement: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const defTabIndex = state?.currentTabIndex;
  const [dataRows, setDataRows] = useState<StoreHurdleWithDisplay[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const apiInstance = useApi();
  const { get, patch, post } = apiInstance;

  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [rowToToggleStatus, setRowToToggleStatus] =
    useState<StoreHurdleWithDisplay | null>(null);

  // Selection state per tab
  const [selectedRowsByTab, setSelectedRowsByTab] = useState<{
    pending: string[];
    forApproval: string[];
    approved: string[];
  }>({
    pending: [],
    forApproval: [],
    approved: [],
  });
  const [currentTab, setCurrentTab] = useState<
    "pending" | "forApproval" | "approved"
  >("pending");
  const [currentTabIndex, setCurrentTabIndex] = useState<0 | 1 | 2>(
    defTabIndex as 0 | 1 | 2
  );
  // const [forceRefresh, setForceRefresh] = useState(0);

  // Bulk action loading states
  const [loadingToggleStatus, setLoadingToggleStatus] = useState(false); // For single row actions
  const [loadingBulkForApproval, setLoadingBulkForApproval] = useState(false);
  const [loadingBulkApproved, setLoadingBulkApproved] = useState(false);
  const [loadingBulkBackToPending, setLoadingBulkBackToPending] =
    useState(false);

  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryHurdle, setSelectedHistoryHurdle] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [bulkActionType, setBulkActionType] = useState<
    "for-approval" | "approved" | "back-to-pending" | null
  >(null);

  // Permission context
  const {
    canViewModule,
    canEditInModule,
    canApproveInModule,
    canRevertInModule,
    canPostInModule,
    loading: permissionsLoading,
  } = useUserPermissions();
  const hasViewPermission = canViewModule("store-hurdles");
  const hasEditPermission = canEditInModule("store-hurdles");
  const hasApprovalPermission = canApproveInModule("store-hurdles");
  const hasRevertPermission = canRevertInModule("store-hurdles");
  const hasPostPermission = canPostInModule("store-hurdles");

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await get<{ data: StoreHurdle[] }>("/warehouse-hurdles");
      if (response) {
        const hurdles = Array.isArray(response) ? response : response.data;
        setDataRows(
          hurdles.map((row: StoreHurdle) => ({
            ...row,
            extension_categories_display: Array.isArray(
              row.extension_categories
            )
              ? row.extension_categories
                  .map((cat) => cat.item_category_code)
                  .join(", ")
              : "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading hurdles:", error);
    } finally {
      setLoadingData(false);
    }
  }, [get]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selection helpers for per-tab state
  const clearSelectedRowsForCurrentTab = useCallback(() => {
    setSelectedRowsByTab((prev) => ({
      ...prev,
      [currentTab]: [],
    }));
  }, [currentTab]);

  const handleEdit = useCallback(
    (id: string | number, rowData: StoreHurdleWithDisplay) => {
      console.log(`Edit store hurdle with ID:`, id, `Data:`, rowData);
      navigate("/store-hurdle-form", {
        state: { hurdleId: id, currentTabIndex: currentTabIndex },
      });
    },
    [navigate, currentTabIndex]
  );

  const handleForApproval = useCallback(
    (id: string | number, rowData: StoreHurdleWithDisplay) => {
      console.log(
        `Send to approval store hurdle with ID:`,
        id,
        `Data:`,
        rowData
      );
      setRowToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleApproved = useCallback(
    (id: string | number, rowData: StoreHurdleWithDisplay) => {
      console.log(`Approve store hurdle with ID:`, id, `Data:`, rowData);
      setRowToToggleStatus(rowData);
      setOpenToggleStatusDialog(true);
    },
    []
  );

  const handleBackToPending = useCallback(
    (id: string | number, rowData: StoreHurdleWithDisplay) => {
      console.log(
        `Back to pending store hurdle with ID:`,
        id,
        `Data:`,
        rowData
      );
      setRowToToggleStatus(rowData);
      setOpenReasonDialog(true); // Use reason dialog for back to pending
    },
    []
  );

  const handleCloseToggleStatusDialog = useCallback(() => {
    setOpenToggleStatusDialog(false);
    setRowToToggleStatus(null);
  }, []);

  const handleCloseReasonDialog = useCallback(() => {
    setOpenReasonDialog(false);
    setRowToToggleStatus(null);
    setBulkActionType(null);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (rowToToggleStatus) {
      try {
        setLoadingToggleStatus(true); // Start loading
        let endpoint = "";

        // Determine endpoint based on current status_id
        switch (rowToToggleStatus.status_id) {
          case 3: // Pending -> For Approval
            endpoint = `/warehouse-hurdles/${rowToToggleStatus.id}/toggle-status-for-approval`;
            break;
          case 6: // For Approval -> Approved
            endpoint = `/warehouse-hurdles/${rowToToggleStatus.id}/toggle-status-approved`;
            break;
          case 7: // Approved -> Back to Pending
            endpoint = `/warehouse-hurdles/${rowToToggleStatus.id}/toggle-status-back-to-pending`;
            break;
          default:
            console.error("Unknown status_id:", rowToToggleStatus.status_id);
            setLoadingToggleStatus(false); // Stop loading on error
            return;
        }

        await patch(endpoint);
        await loadData();
        setOpenToggleStatusDialog(false);
        setRowToToggleStatus(null);
        setCurrentTabIndex(currentTabIndex);
        clearSelectedRowsForCurrentTab();
      } catch (error) {
        console.error("Error toggling hurdle status:", error);
      } finally {
        setLoadingToggleStatus(false); // Stop loading
      }
    }
  }, [
    rowToToggleStatus,
    patch,
    loadData,
    currentTabIndex,
    clearSelectedRowsForCurrentTab,
  ]);

  const handleNew = useCallback(() => {
    navigate("/store-hurdle-form", {
      state: { currentTabIndex: currentTabIndex },
    });
  }, [navigate, currentTabIndex]);

  const handleViewHistory = useCallback(
    (_rowId: string | number, rowData: StoreHurdleWithDisplay) => {
      setSelectedHistoryHurdle({
        id: rowData.id,
        name: `${rowData.warehouse_name} - ${rowData.hurdle_date}`,
      });
      setHistoryDialogOpen(true);
    },
    []
  );

  const handleUpload = useCallback(() => {
    navigate("/store-hurdles/upload", {
      state: { currentTabIndex: currentTabIndex },
    });
  }, [navigate, currentTabIndex]);

  // Handler for undo reason dialog
  const handleConfirmActionWithReason = useCallback(
    async (reason: string) => {
      if (rowToToggleStatus) {
        try {
          setLoadingToggleStatus(true); // Start loading for individual action
          const endpoint = `/warehouse-hurdles/${rowToToggleStatus.id}/toggle-status-back-to-pending`;
          await patch(endpoint, { undo_reason: reason });
          await loadData();
          setOpenReasonDialog(false);
          setRowToToggleStatus(null);
          setCurrentTabIndex(currentTabIndex);
          clearSelectedRowsForCurrentTab();
        } catch (error) {
          console.error("Error reverting hurdle to pending:", error);
        } finally {
          setLoadingToggleStatus(false); // Stop loading
        }
      } else if (
        bulkActionType === "back-to-pending" &&
        selectedRowsByTab[currentTab].length > 0
      ) {
        try {
          setLoadingBulkBackToPending(true);
          await post("/warehouse-hurdles/change-bulk-status", {
            ids: selectedRowsByTab[currentTab],
            status_id: 3,
            undo_reason: reason,
          });
          await loadData();
          setOpenReasonDialog(false);
          setBulkActionType(null);
          clearSelectedRowsForCurrentTab();
        } catch (error) {
          console.error("Error bulk reverting hurdles to pending:", error);
        } finally {
          setLoadingBulkBackToPending(false);
        }
      }
    },
    [
      rowToToggleStatus,
      bulkActionType,
      selectedRowsByTab,
      currentTab,
      patch,
      post,
      loadData,
      clearSelectedRowsForCurrentTab,
      currentTabIndex,
    ]
  );

  // Bulk action handlers
  const handleBulkForApproval = useCallback(() => {
    const currentSelectedRows = selectedRowsByTab[currentTab];
    if (currentSelectedRows.length === 0) {
      console.warn("No rows selected for bulk action");
      return;
    }
    setBulkActionType("for-approval");
    setOpenToggleStatusDialog(true);
  }, [selectedRowsByTab, currentTab]);

  const handleBulkApproved = useCallback(() => {
    const currentSelectedRows = selectedRowsByTab[currentTab];
    if (currentSelectedRows.length === 0) {
      console.warn("No rows selected for bulk action");
      return;
    }
    setBulkActionType("approved");
    setOpenToggleStatusDialog(true);
  }, [selectedRowsByTab, currentTab]);

  const handleBulkBackToPending = useCallback(() => {
    const currentSelectedRows = selectedRowsByTab[currentTab];
    if (currentSelectedRows.length === 0) {
      console.warn("No rows selected for bulk action");
      return;
    }
    setBulkActionType("back-to-pending");
    setOpenReasonDialog(true);
  }, [selectedRowsByTab, currentTab]);

  const handleConfirmBulkAction = useCallback(async () => {
    const currentSelectedRows = selectedRowsByTab[currentTab];
    if (bulkActionType && currentSelectedRows.length > 0) {
      try {
        // Set appropriate loading state
        if (bulkActionType === "for-approval") {
          setLoadingBulkForApproval(true);
        } else if (bulkActionType === "approved") {
          setLoadingBulkApproved(true);
        } else if (bulkActionType === "back-to-pending") {
          setLoadingBulkBackToPending(true);
        }

        let statusId = 6; // Default to for-approval
        if (bulkActionType === "approved") statusId = 7;
        else if (bulkActionType === "back-to-pending") statusId = 3;

        await post("/warehouse-hurdles/change-bulk-status", {
          ids: currentSelectedRows,
          status_id: statusId,
        });
        await loadData();
        setOpenToggleStatusDialog(false);
        setBulkActionType(null);
        clearSelectedRowsForCurrentTab();
      } catch (error) {
        console.error("Error performing bulk action:", error);
      } finally {
        // Clear all loading states
        setLoadingBulkForApproval(false);
        setLoadingBulkApproved(false);
        setLoadingBulkBackToPending(false);
        setCurrentTabIndex(currentTabIndex);
      }
    }
  }, [
    bulkActionType,
    selectedRowsByTab,
    currentTab,
    post,
    loadData,
    clearSelectedRowsForCurrentTab,
    currentTabIndex,
  ]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newTabIndex: number) => {
      // Map tab index to tab key
      const tabKeys: ("pending" | "forApproval" | "approved")[] = [
        "pending",
        "forApproval",
        "approved",
      ];
      const newTab = tabKeys[newTabIndex] || "pending";
      console.log(`Tab changed to: ${newTab} (index: ${newTabIndex})`);

      // Clear all selections when switching tabs to avoid confusion
      setSelectedRowsByTab({
        pending: [],
        forApproval: [],
        approved: [],
      });

      setCurrentTab(newTab);
      setCurrentTabIndex(newTabIndex as 0 | 1 | 2);
    },
    []
  );

  // Separate handlers for each tab to avoid any confusion
  const handlePendingSelectionChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSelection: any) => {
      console.log("=== PENDING SELECTION CHANGE ===");
      console.log("Pending selection changed:", newSelection);
      console.log("Type:", typeof newSelection);
      console.log("Is Array:", Array.isArray(newSelection));
      console.log("Is Set:", newSelection instanceof Set);
      console.log("Has ids property:", newSelection?.ids);

      // Handle different selection formats from DataGrid
      let selectionArray: (string | number)[] = [];

      if (Array.isArray(newSelection)) {
        // Direct array
        selectionArray = newSelection;
      } else if (newSelection instanceof Set) {
        // Direct Set
        selectionArray = Array.from(newSelection);
      } else if (
        newSelection &&
        typeof newSelection === "object" &&
        newSelection.ids
      ) {
        // Selection object with ids property (MUI DataGrid format)
        if (newSelection.ids instanceof Set) {
          selectionArray = Array.from(newSelection.ids);
        } else if (Array.isArray(newSelection.ids)) {
          selectionArray = newSelection.ids;
        }
      } else {
        console.warn("Unexpected selection type:", newSelection);
        selectionArray = [];
      }

      const stringSelection = selectionArray.map((id) => String(id));
      console.log("Setting pending selectedRows to:", stringSelection);
      setSelectedRowsByTab((prev) => ({
        ...prev,
        pending: stringSelection,
      }));
      console.log("=== END PENDING SELECTION ===");
    },
    []
  );

  const handleForApprovalSelectionChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSelection: any) => {
      console.log("=== FOR APPROVAL SELECTION CHANGE ===");
      console.log("For approval selection changed:", newSelection);

      // Handle different selection formats from DataGrid
      let selectionArray: (string | number)[] = [];

      if (Array.isArray(newSelection)) {
        selectionArray = newSelection;
      } else if (newSelection instanceof Set) {
        selectionArray = Array.from(newSelection);
      } else if (
        newSelection &&
        typeof newSelection === "object" &&
        newSelection.ids
      ) {
        // Selection object with ids property (MUI DataGrid format)
        if (newSelection.ids instanceof Set) {
          selectionArray = Array.from(newSelection.ids);
        } else if (Array.isArray(newSelection.ids)) {
          selectionArray = newSelection.ids;
        }
      } else {
        selectionArray = [];
      }

      const stringSelection = selectionArray.map((id) => String(id));
      console.log("Setting forApproval selectedRows to:", stringSelection);
      setSelectedRowsByTab((prev) => ({
        ...prev,
        forApproval: stringSelection,
      }));
      console.log("=== END FOR APPROVAL SELECTION ===");
    },
    []
  );

  const handleApprovedSelectionChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSelection: any) => {
      console.log("=== APPROVED SELECTION CHANGE ===");
      console.log("Approved selection changed:", newSelection);

      // Handle different selection formats from DataGrid
      let selectionArray: (string | number)[] = [];

      if (Array.isArray(newSelection)) {
        selectionArray = newSelection;
      } else if (newSelection instanceof Set) {
        selectionArray = Array.from(newSelection);
      } else if (
        newSelection &&
        typeof newSelection === "object" &&
        newSelection.ids
      ) {
        // Selection object with ids property (MUI DataGrid format)
        if (newSelection.ids instanceof Set) {
          selectionArray = Array.from(newSelection.ids);
        } else if (Array.isArray(newSelection.ids)) {
          selectionArray = newSelection.ids;
        }
      } else {
        selectionArray = [];
      }

      const stringSelection = selectionArray.map((id) => String(id));
      console.log("Setting approved selectedRows to:", stringSelection);
      setSelectedRowsByTab((prev) => ({
        ...prev,
        approved: stringSelection,
      }));
      console.log("=== END APPROVED SELECTION ===");
    },
    []
  );

  // Debug effect to track selected rows changes per tab
  useEffect(() => {
    console.log(">>> selectedRowsByTab state changed to:", selectedRowsByTab);
  }, [selectedRowsByTab]);

  // Dynamic action buttons based on status_id
  const getActionButtons = useCallback(
    (row: StoreHurdleWithDisplay): DataGridAction<StoreHurdleWithDisplay>[] => {
      const actions: DataGridAction<StoreHurdleWithDisplay>[] = [];

      // History button - always available for all statuses
      actions.push({
        type: "history",
        tooltip: "View History",
        icon: History,
        onClick: handleViewHistory,
        color: "info",
        ariaLabel: "history",
      });

      switch (row.status_id) {
        case 3: // PENDING
          // Edit button - only if user has edit permission
          if (hasEditPermission) {
            actions.push({
              type: "edit",
              tooltip: "Edit Store Hurdle",
              icon: Edit,
              onClick: handleEdit,
              color: "primary",
              ariaLabel: "edit",
            });
          }

          // For Approval button
          if (hasPostPermission) {
            actions.push({
              type: "for-approval",
              tooltip: "Send for Approval",
              icon: Schedule,
              onClick: handleForApproval,
              color: "warning",
              ariaLabel: "for-approval",
            });
          }
          break;

        case 6: // FOR APPROVAL
          // Edit button - only if user has edit permission
          if (hasEditPermission) {
            actions.push({
              type: "edit",
              tooltip: "Edit Store Hurdle",
              icon: Edit,
              onClick: handleEdit,
              color: "primary",
              ariaLabel: "edit",
            });
          }

          // Approved button
          if (hasApprovalPermission) {
            actions.push({
              type: "approved",
              tooltip: "Approve",
              icon: ThumbUp,
              onClick: handleApproved,
              color: "success",
              ariaLabel: "approved",
            });
          }

          // Back to Pending button
          if (hasRevertPermission) {
            actions.push({
              type: "back-to-pending",
              tooltip: "Revert to Pending",
              icon: Undo,
              onClick: handleBackToPending,
              color: "warning",
              ariaLabel: "back-to-pending",
            });
          }
          break;

        case 7: // APPROVED
          // Back to Pending button
          if (hasRevertPermission) {
            actions.push({
              type: "back-to-pending",
              tooltip: "Revert to Pending",
              icon: Undo,
              onClick: handleBackToPending,
              color: "warning",
              ariaLabel: "back-to-pending",
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
      handleEdit,
      handleForApproval,
      handleApproved,
      handleBackToPending,
      hasApprovalPermission,
      hasRevertPermission,
      hasPostPermission,
      handleViewHistory,
    ]
  );

  const columns: GridColDef<StoreHurdleWithDisplay>[] = useMemo(() => {
    const generatedColumns =
      mapColumnConfigToGridColDef<StoreHurdleWithDisplay>(COLUMN_CONFIG);
    // Patch the extension_categories column to use the generic object array renderer
    const patchedColumns = generatedColumns.map((col) => {
      if (col.field === "extension_categories" && col.renderCell) {
        return {
          ...col,
          renderCell: (params: GridRenderCellParams<StoreHurdleWithDisplay>) =>
            GenericObjectArrayFieldRenderer({
              ...params,
              arrayField: "extension_categories",
              getDisplayValue: (cat: Record<string, unknown>) =>
                typeof cat === "object" && cat && "item_category_code" in cat
                  ? String(
                      (cat as { item_category_code: string }).item_category_code
                    )
                  : "",
            }),
        };
      }
      return col;
    });
    return [
      ...patchedColumns,
      {
        field: "actions",
        headerName: "Actions",
        headerAlign: "center",
        flex: 1.2,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<StoreHurdleWithDisplay>) => {
          if (!params.row) return null;
          const id = params.row.id;
          const rowData = params.row;
          return (
            <DatagridActions<StoreHurdleWithDisplay>
              rowId={id}
              actions={getActionButtons(rowData)}
              rowData={rowData}
            />
          );
        },
      },
    ];
  }, [getActionButtons]);

  const dialogMessage = useMemo(
    () => (
      <>
        Are you sure you want to
        {rowToToggleStatus?.status_id === 3
          ? " send for approval"
          : rowToToggleStatus?.status_id === 6
          ? " approve"
          : rowToToggleStatus?.status_id === 7
          ? " revert to pending"
          : " confirm action on"}{" "}
        Store Hurdle "
        <strong>{rowToToggleStatus?.warehouse_name || "this hurdle"}</strong>"?
        This action cannot be undone.
      </>
    ),
    [rowToToggleStatus?.status_id, rowToToggleStatus?.warehouse_name]
  );

  const dialogTitle = useMemo(() => {
    return rowToToggleStatus?.status_id === 3
      ? "Send for Approval"
      : rowToToggleStatus?.status_id === 6
      ? "Approve Hurdle"
      : rowToToggleStatus?.status_id === 7
      ? "Revert to Pending"
      : "Confirm Action";
  }, [rowToToggleStatus]);

  // Filter dataRows by status_id
  const pendingRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 3),
    [dataRows]
  );
  const forApprovalRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 6),
    [dataRows]
  );
  const approvedRows = useMemo(
    () => dataRows.filter((row) => row.status_id === 7),
    [dataRows]
  );

  // Tab configs for ReusableTabs
  const tabs: TabConfig[] = [
    {
      label: "Pending",
      content: (
        <Box>
          <BulkActionButtons
            statusId={3}
            hasEditPermission={hasEditPermission}
            hasApprovalPermission={hasApprovalPermission}
            hasRevertPermission={hasRevertPermission}
            hasPostPermission={hasPostPermission}
            selectedRows={selectedRowsByTab.pending}
            onBulkForApproval={handleBulkForApproval}
            onBulkApproved={handleBulkApproved}
            onBulkBackToPending={handleBulkBackToPending}
            loadingBulkForApproval={loadingBulkForApproval}
            loadingBulkApproved={loadingBulkApproved}
            loadingBulkBackToPending={loadingBulkBackToPending}
          />
          <CustomDataGrid<StoreHurdleWithDisplay>
            key="pending-datagrid"
            rows={pendingRows}
            columns={columns}
            getRowId={(row: StoreHurdleWithDisplay) => row.id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
            checkboxSelection={true}
            onRowSelectionModelChange={handlePendingSelectionChange}
          />
          {/* Debug display for Pending tab */}
          {/* <Box sx={{ p: 1, bgcolor: "background.paper", fontSize: "0.8rem" }}>
            Debug - Pending tab: selectedRows:{" "}
            {JSON.stringify(selectedRowsByTab.pending)} (length:{" "}
            {selectedRowsByTab.pending.length})
            <br />
            All tabs state: {JSON.stringify(selectedRowsByTab)}
          </Box> */}
        </Box>
      ),
    },
    {
      label: "For Approval",
      content: (
        <Box>
          <BulkActionButtons
            statusId={6}
            hasEditPermission={hasEditPermission}
            hasApprovalPermission={hasApprovalPermission}
            hasRevertPermission={hasRevertPermission}
            hasPostPermission={hasPostPermission}
            selectedRows={selectedRowsByTab.forApproval}
            onBulkForApproval={handleBulkForApproval}
            onBulkApproved={handleBulkApproved}
            onBulkBackToPending={handleBulkBackToPending}
            loadingBulkForApproval={loadingBulkForApproval}
            loadingBulkApproved={loadingBulkApproved}
            loadingBulkBackToPending={loadingBulkBackToPending}
          />
          <CustomDataGrid<StoreHurdleWithDisplay>
            key="for-approval-datagrid"
            rows={forApprovalRows}
            columns={columns}
            getRowId={(row: StoreHurdleWithDisplay) => row.id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
            checkboxSelection={true}
            onRowSelectionModelChange={handleForApprovalSelectionChange}
          />
          {/* Debug display for For Approval tab */}
          {/* <Box sx={{ p: 1, bgcolor: "background.paper", fontSize: "0.8rem" }}>
            Debug - For Approval tab: selectedRows:{" "}
            {JSON.stringify(selectedRowsByTab.forApproval)} (length:{" "}
            {selectedRowsByTab.forApproval.length})
            <br />
            All tabs state: {JSON.stringify(selectedRowsByTab)}
          </Box> */}
        </Box>
      ),
    },
    {
      label: "Approved",
      content: (
        <Box>
          <BulkActionButtons
            statusId={7}
            hasEditPermission={hasEditPermission}
            hasApprovalPermission={hasApprovalPermission}
            hasRevertPermission={hasRevertPermission}
            hasPostPermission={hasPostPermission}
            selectedRows={selectedRowsByTab.approved}
            onBulkForApproval={handleBulkForApproval}
            onBulkApproved={handleBulkApproved}
            onBulkBackToPending={handleBulkBackToPending}
            loadingBulkForApproval={loadingBulkForApproval}
            loadingBulkApproved={loadingBulkApproved}
            loadingBulkBackToPending={loadingBulkBackToPending}
          />
          <CustomDataGrid<StoreHurdleWithDisplay>
            key="approved-datagrid"
            rows={approvedRows}
            columns={columns}
            getRowId={(row: StoreHurdleWithDisplay) => row.id}
            initialMobileHiddenFields={mobileHiddenFields}
            initialNonMobileHiddenFields={nonMobileHiddenFields}
            loading={loadingData}
            checkboxSelection={true}
            onRowSelectionModelChange={handleApprovedSelectionChange}
          />
          {/* Debug display for Approved tab */}
          {/* <Box sx={{ p: 1, bgcolor: "background.paper", fontSize: "0.8rem" }}>
            Debug - Approved tab: selectedRows:{" "}
            {JSON.stringify(selectedRowsByTab.approved)} (length:{" "}
            {selectedRowsByTab.approved.length})
            <br />
            All tabs state: {JSON.stringify(selectedRowsByTab)}
          </Box> */}
        </Box>
      ),
    },
  ];

  if (loadingData || permissionsLoading) {
    return <PageLoader modulename="Store Hurdles" />;
  }

  if (!hasViewPermission) {
    return <NotAuthorized />;
  }

  return (
    <Box m="0px 10px auto 10px">
      <Header
        title="STORE HURDLE MANAGEMENT"
        subtitle="Manage store hurdles"
        actionButton={
          <>
            <HeaderActionButton
              moduleAlias="store-hurdles"
              onClick={handleNew}
            />
            <HeaderActionButton
              moduleAlias="store-hurdles"
              onClick={handleUpload}
              text="Upload"
              icon={UploadOutlinedIcon}
            />
          </>
        }
      />
      <ReusableTabs
        value={currentTabIndex}
        tabs={tabs}
        onChange={handleTabChange}
      />
      <ConfirmationDialog
        open={openToggleStatusDialog}
        onClose={handleCloseToggleStatusDialog}
        onConfirm={
          bulkActionType ? handleConfirmBulkAction : handleConfirmToggleStatus
        }
        message={
          bulkActionType
            ? `Are you sure you want to ${
                bulkActionType === "for-approval"
                  ? "send for approval"
                  : bulkActionType === "approved"
                  ? "approve"
                  : "revert to pending"
              } ${selectedRowsByTab[currentTab]?.length || 0} selected items?`
            : dialogMessage
        }
        title={
          bulkActionType
            ? `Bulk ${
                bulkActionType.charAt(0).toUpperCase() +
                bulkActionType.slice(1).replace("-", " ")
              }`
            : dialogTitle
        }
        loading={
          bulkActionType === "for-approval"
            ? loadingBulkForApproval
            : bulkActionType === "approved"
            ? loadingBulkApproved
            : bulkActionType === "back-to-pending"
            ? loadingBulkBackToPending
            : loadingToggleStatus
        }
      />
      <TransactionActionDialog
        open={openReasonDialog}
        onClose={handleCloseReasonDialog}
        onConfirm={handleConfirmActionWithReason}
        message={
          bulkActionType === "back-to-pending"
            ? `Please provide a reason for reverting ${
                selectedRowsByTab[currentTab]?.length > 0
                  ? selectedRowsByTab[currentTab].length + " items"
                  : "the selected item"
              } back to pending status:`
            : `Please provide a reason for reverting "${
                rowToToggleStatus?.warehouse_name || "this hurdle"
              }" back to pending status:`
        }
        title="Revert to Pending"
        reasonLabel="Undo Reason"
        reasonPlaceholder="Enter reason for reverting back to pending..."
        confirmButtonText="Revert to Pending"
        confirmButtonColor="warning"
        required={true}
        loading={loadingBulkBackToPending}
      />
      <HurdleHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        hurdleId={selectedHistoryHurdle?.id ?? null}
        hurdleName={selectedHistoryHurdle?.name ?? ""}
      />
    </Box>
  );
};

export default StoreHurdleManagement;
