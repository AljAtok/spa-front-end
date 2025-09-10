import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";

// Define the interface for history item with optional properties to handle variations in API responses
export interface HurdleHistoryItem {
  id?: number;
  module_id?: number;
  module_name?: string;
  ref_id?: number;
  action_id?: number;
  action_name?: string;
  actionName?: string; // Alternative property name
  description?: string;
  desc?: string; // Alternative property name
  raw_data?: Record<string, unknown>;
  createdBy?: {
    full_name?: string;
    name?: string; // Alternative property name
  };
  created_at?: string;
  createdAt?: string; // Alternative property name
  timestamp?: string; // Alternative property name
  date?: string; // Alternative property name
}

interface HurdleHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  hurdleId: number | null;
  hurdleName: string;
}

const HurdleHistoryDialog: React.FC<HurdleHistoryDialogProps> = ({
  open,
  onClose,
  hurdleId,
  hurdleName,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HurdleHistoryItem[] | null>(
    null
  );
  const { get } = useApi();

  const fetchHurdleHistory = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      console.log(`Fetching history for hurdle ID: ${id}`);

      try {
        // Make a direct API call without strong typing to inspect the actual response structure
        const response = await get(`/warehouse-hurdles/history/${id}`);
        console.log("Raw API response:", response);

        // Very detailed logging to diagnose the exact response structure
        console.log("Response structure:", JSON.stringify(response, null, 2));

        // Handle different response formats that might come from the API
        let historyItems: HurdleHistoryItem[] = [];

        // Case 1: Response is the array directly
        if (Array.isArray(response)) {
          console.log("Response is an array directly");
          historyItems = response as HurdleHistoryItem[];
        }
        // Case 2: Response is an object with a data property
        // else if (response && typeof response === "object") {
        //   console.log("Response is an object");

        //   // Case 2a: response.data is an array
        //   if ("data" in response && Array.isArray(response.data)) {
        //     console.log("Response has data array property");
        //     historyItems = response.data as HurdleHistoryItem[];
        //   }
        //   // Case 2b: The response itself is a direct data object (for single item)
        //   else if (
        //     "id" in response &&
        //     ("action_name" in response || "actionName" in response) &&
        //     ("description" in response || "desc" in response)
        //   ) {
        //     console.log("Response is a single history item");
        //     historyItems = [response as unknown as HurdleHistoryItem];
        //   }
        //   // Case 2c: response has a results or items array
        //   else if ("results" in response && Array.isArray(response.results)) {
        //     console.log("Response has results array");
        //     historyItems = response.results as HurdleHistoryItem[];
        //   } else if ("items" in response && Array.isArray(response.items)) {
        //     console.log("Response has items array");
        //     historyItems = response.items as HurdleHistoryItem[];
        //   }
        //   // Case 2d: Iterate through response properties to find an array
        //   else {
        //     console.log("Searching for arrays in response");
        //     const objResponse = response as Record<string, unknown>;
        //     for (const key in objResponse) {
        //       if (Array.isArray(objResponse[key])) {
        //         console.log(`Found array in response property: ${key}`);
        //         historyItems = objResponse[key] as HurdleHistoryItem[];
        //         break;
        //       }
        //     }
        //   }
        // }

        console.log("Processed history items:", historyItems);

        // Check if we have valid history items
        if (historyItems && historyItems.length > 0) {
          // Validate that these are actually history items with required fields
          const validItems = historyItems.filter(
            (item) =>
              item &&
              typeof item === "object" &&
              ("id" in item ||
                "action_name" in item ||
                "description" in item ||
                "createdBy" in item)
          );

          if (validItems.length > 0) {
            console.log("Valid history items found:", validItems.length);
            setHistoryData(validItems);
            setError(null);
          } else {
            console.warn("Found items but they don't match expected structure");
            setHistoryData([]);
            setError("Response contained data but not in the expected format");
          }
        } else {
          console.warn("No valid history items found in response");
          setHistoryData([]);
          setError("No history data found in server response");
        }
      } catch (err) {
        console.error("Error fetching hurdle history:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(`Failed to fetch hurdle history: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  useEffect(() => {
    if (open && hurdleId) {
      console.log(
        `Dialog opened for hurdleId ${hurdleId}, fetching history data...`
      );
      fetchHurdleHistory(hurdleId);
    } else {
      console.log(`Dialog state change - open: ${open}, hurdleId: ${hurdleId}`);
    }
  }, [open, hurdleId, fetchHurdleHistory]);

  const handleClose = () => {
    onClose();
    // Clear data when dialog closes, but after a slight delay
    setTimeout(() => {
      setHistoryData(null);
      setError(null);
    }, 300);
  };

  // Helper function to get color based on action_name
  const getActionColor = (actionName: string = "") => {
    const action = actionName.toUpperCase();

    // Handle ADD/CREATE actions
    if (
      action.includes("ADD") ||
      action.includes("CREATE") ||
      action.includes("NEW")
    ) {
      return "primary.main";
    }

    // Handle EDIT/UPDATE actions
    if (
      action.includes("EDIT") ||
      action.includes("UPDATE") ||
      action.includes("ACTIVATE") ||
      action.includes("MODIFY")
    ) {
      return "secondary.main";
    }

    // Handle APPROVE actions
    if (action.includes("APPROVE") || action.includes("ACCEPT")) {
      return "success.main";
    }

    // Handle DEACTIVATE actions
    if (
      action.includes("DEACTIVATE") ||
      action.includes("SUSPEND") ||
      action.includes("HOLD")
    ) {
      return "warning.main";
    }

    // Handle CANCEL/REJECT actions
    if (
      action.includes("CANCEL") ||
      action.includes("REJECT") ||
      action.includes("DENY") ||
      action.includes("BACK")
    ) {
      return "error.main";
    }

    return "text.secondary";
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          minHeight: "60vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center">
          <HistoryIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">
            Activity History: {hurdleName || "Store Hurdle"}
          </Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : !historyData ||
          !Array.isArray(historyData) ||
          historyData.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body1">
              No history data available for this hurdle.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {error
                  ? error
                  : "The system may not have recorded any actions for this hurdle yet."}
              </Typography>
              {!error && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  If you believe this is incorrect, please check the browser
                  console for API response details.
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            {/* Vertical line */}
            <Box
              sx={{
                position: "absolute",
                left: "12px",
                top: 0,
                bottom: 0,
                width: "2px",
                backgroundColor: "divider",
              }}
            />

            {/* Timeline items */}
            {historyData.map((item, index) => {
              // Safely access properties with fallbacks and alternative property names
              const itemId = item.id || index;
              const actionName =
                item.action_name || item.actionName || "Action";
              const description =
                item.description || item.desc || "No description provided";

              // Handle different possible structures for createdBy
              let createdBy = "Unknown user";
              if (item.createdBy && typeof item.createdBy === "object") {
                createdBy =
                  item.createdBy.full_name ||
                  item.createdBy.name ||
                  "Unknown user";
              } else if (typeof item.createdBy === "string") {
                createdBy = item.createdBy;
              }

              // Handle different date formats and property names
              const dateValue =
                item.created_at ||
                item.createdAt ||
                item.timestamp ||
                item.date;
              let createdAt = "Unknown date";
              if (dateValue) {
                try {
                  createdAt = new Date(dateValue).toLocaleString();
                } catch (error) {
                  console.warn("Invalid date format:", dateValue, error);
                  createdAt = dateValue.toString();
                }
              }

              return (
                <Box
                  key={itemId}
                  sx={{ display: "flex", mb: 3, position: "relative" }}
                >
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: getActionColor(actionName),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                      zIndex: 1,
                    }}
                  />

                  {/* Content */}
                  <Box
                    sx={{
                      p: 2,
                      flex: 1,
                      borderLeft: `4px solid ${getActionColor(actionName)}`,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {actionName}
                    </Typography>
                    <Typography variant="body1" sx={{ my: 1 }}>
                      {description}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        By: {createdBy}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {createdAt}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HurdleHistoryDialog;
