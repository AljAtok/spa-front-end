import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import PageLoader from "../../components/PageLoader";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import { AuditTrailLog } from "../../types/AuditTrailTypes";
import FormHeader from "@/components/FormHeader";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatDateTime } from "@/utils/dateFormatter";

const fieldLabels: { [key: string]: string } = {
  id: "ID",
  service: "Service",
  method: "Method",
  description: "Description",
  //   status_name: "Status",
  created_user: "Created By",
  created_at: "Created At",
  raw_data: "Raw Data",
};

const AuditTrailDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [log, setLog] = useState<AuditTrailLog | null>(
    location.state?.auditLog || null
  );
  const [loading, setLoading] = useState(!log);
  const apiInstance = useApi();
  const navigate = useNavigate();
  const { get } = apiInstance;

  useEffect(() => {
    if (!log && id) {
      setLoading(true);
      get(`/user-audit-trail/${id}`)
        .then((response: unknown) => {
          // Try to handle both { data: AuditTrailLog } and AuditTrailLog directly
          if (
            typeof response === "object" &&
            response !== null &&
            "data" in response &&
            (response as { data?: unknown }).data
          ) {
            setLog((response as { data: AuditTrailLog }).data);
          } else {
            setLog(response as AuditTrailLog);
          }
        })
        .catch(() => setLog(null))
        .finally(() => setLoading(false));
    }
  }, [id, log, get]);

  if (loading) return <PageLoader modulename="Audit Log Detail" />;
  if (!log) return <NotAuthorized />;

  let parsedRawData: Record<string, unknown> | string | null = null;
  try {
    parsedRawData = log.raw_data ? JSON.parse(log.raw_data) : null;
  } catch {
    parsedRawData = log.raw_data;
  }

  return (
    <Box m={3}>
      <Paper elevation={2} sx={{ p: 3, maxWidth: 900, margin: "auto" }}>
        <FormHeader
          title="Audit Log Detail"
          actionButton={
            <Button
              variant="outlined"
              color="success"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/audit-trail")}
              sx={{ ml: 2 }}
            >
              Back to Audit Trail
            </Button>
          }
        />
        {/* <Typography variant="h5" gutterBottom>
          Audit Log Detail
        </Typography> */}
        {/* <Divider sx={{ mb: 2 }} /> */}
        {Object.entries(fieldLabels).map(([field, label]) =>
          field !== "raw_data" && log[field] ? (
            <Box key={field} mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                {label}
              </Typography>
              <Typography variant="body1">
                {field === "created_at"
                  ? formatDateTime(log[field])
                  : (log[field] as string)}
              </Typography>
            </Box>
          ) : null
        )}
        <Box mb={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Raw Data
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, background: "#f7f7f7" }}>
            {parsedRawData && typeof parsedRawData === "object" ? (
              <pre style={{ margin: 0, fontSize: 14 }}>
                {JSON.stringify(parsedRawData, null, 2)}
              </pre>
            ) : (
              <Typography variant="body2">{log.raw_data}</Typography>
            )}
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuditTrailDetail;
