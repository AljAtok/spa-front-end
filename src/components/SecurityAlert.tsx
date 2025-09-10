// src/components/SecurityAlert.tsx

import React from "react";
import {
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useSecurity } from "../hooks/useSecurity";
import { tokens } from "../styles/theme";

const SecurityAlert: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { securityAlerts, dismissAlert, securityAudit } = useSecurity();

  // Don't render if no alerts
  if (securityAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getAlertSeverity = (
    type: string
  ): "error" | "warning" | "info" | "success" => {
    switch (type) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
        width: "100%",
      }}
    >
      {securityAlerts.map((alert) => (
        <Collapse key={alert.id} in={!alert.dismissed}>
          <Alert
            severity={getAlertSeverity(alert.type)}
            icon={getAlertIcon(alert.type)}
            sx={{
              mb: 1,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& .MuiAlert-icon": {
                color:
                  alert.type === "error"
                    ? colors.redAccent[500]
                    : alert.type === "warning"
                    ? colors.blueAccent[500]
                    : colors.greenAccent[500],
              },
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => dismissAlert(alert.id)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>Security Alert</AlertTitle>
            <Typography variant="body2">{alert.message}</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {alert.timestamp.toLocaleTimeString()}
            </Typography>

            {/* Show security details for comprehensive alerts */}
            {alert.type === "error" &&
              securityAudit.vulnerabilities.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Vulnerabilities:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {securityAudit.vulnerabilities
                      .slice(0, 3)
                      .map((vuln, idx) => (
                        <ListItem key={idx} sx={{ py: 0, px: 1 }}>
                          <ListItemText
                            primary={vuln}
                            primaryTypographyProps={{
                              variant: "caption",
                              color: colors.grey[300],
                            }}
                          />
                        </ListItem>
                      ))}
                    {securityAudit.vulnerabilities.length > 3 && (
                      <ListItem sx={{ py: 0, px: 1 }}>
                        <ListItemText
                          primary={`... and ${
                            securityAudit.vulnerabilities.length - 3
                          } more`}
                          primaryTypographyProps={{
                            variant: "caption",
                            color: colors.grey[400],
                            fontStyle: "italic",
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
};

export default SecurityAlert;
