import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  CheckCircle,
  Send,
  RestoreFromTrash,
  Add,
  Edit,
  Info,
} from "@mui/icons-material";
import { formatDistanceToNow, parseISO } from "date-fns";

// Define the interface for history item
export interface HurdleHistoryItem {
  id: number;
  module_id: number;
  module_name: string;
  ref_id: number;
  action_id: number;
  action_name: string;
  description: string;
  raw_data: string;
  createdBy: {
    full_name: string;
  };
  created_at: string;
}

interface HurdleHistoryTimelineProps {
  historyData: HurdleHistoryItem[] | null;
  loading: boolean;
  error: string | null;
}

// Helper function to determine icon based on action_name
const getActionIcon = (actionName: string) => {
  switch (actionName.toUpperCase()) {
    case "ADD":
      return <Add color="primary" />;
    case "EDIT":
      return <Edit color="primary" />;
    case "APPROVE":
      return <CheckCircle color="success" />;
    case "DEACTIVATE":
      return <Send color="warning" />;
    case "CANCEL":
      return <RestoreFromTrash color="error" />;
    default:
      return <Info color="info" />;
  }
};

// Helper function to determine dot color based on action_name
const getDotColor = (actionName: string) => {
  switch (actionName.toUpperCase()) {
    case "ADD":
      return "primary";
    case "EDIT":
      return "primary";
    case "APPROVE":
      return "success";
    case "DEACTIVATE":
      return "warning";
    case "CANCEL":
      return "error";
    default:
      return "grey";
  }
};

const HurdleHistoryTimeline: React.FC<HurdleHistoryTimelineProps> = ({
  historyData,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">No history data available.</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ maxHeight: "70vh", overflow: "auto", p: 2, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Hurdle Activity History
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Timeline position="right">
        {historyData.map((item) => {
          const formattedDate = formatDistanceToNow(parseISO(item.created_at), {
            addSuffix: true,
          });
          const actionIcon = getActionIcon(item.action_name);
          const dotColor = getDotColor(item.action_name);

          return (
            <TimelineItem key={item.id}>
              <TimelineOppositeContent sx={{ flex: 0.2 }}>
                <Typography variant="body2" color="text.secondary">
                  {formattedDate}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot
                  color={
                    dotColor as
                      | "inherit"
                      | "grey"
                      | "primary"
                      | "secondary"
                      | "error"
                      | "info"
                      | "success"
                      | "warning"
                  }
                  variant="outlined"
                >
                  {actionIcon}
                </TimelineDot>
                {item.id !== historyData[historyData.length - 1].id && (
                  <TimelineConnector />
                )}
              </TimelineSeparator>

              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                    p: 2,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    component="span"
                    fontWeight="medium"
                  >
                    {item.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    By {item.createdBy.full_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {new Date(item.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Paper>
  );
};

export default HurdleHistoryTimeline;
