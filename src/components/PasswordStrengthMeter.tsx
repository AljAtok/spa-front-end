// src/components/PasswordStrengthMeter.tsx
import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { PasswordStrengthMetrics } from "../types/ProfileTypes";
import {
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../utils/passwordStrength";

interface PasswordStrengthMeterProps {
  metrics: PasswordStrengthMetrics;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  metrics,
}) => {
  const strengthLabel = getPasswordStrengthLabel(metrics.score);
  const strengthColor = getPasswordStrengthColor(metrics.score);
  const progress = (metrics.score / 4) * 100;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Password Strength:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: strengthColor,
            fontWeight: "bold",
          }}
        >
          {strengthLabel}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "#e0e0e0",
          "& .MuiLinearProgress-bar": {
            backgroundColor: strengthColor,
          },
        }}
      />

      {metrics.feedback.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Password requirements:
          </Typography>
          <List dense sx={{ pl: 2 }}>
            {metrics.feedback.map((item, index) => (
              <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                <ListItemText
                  primary={item}
                  primaryTypographyProps={{
                    variant: "body2",
                    color: "text.secondary",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default PasswordStrengthMeter;
