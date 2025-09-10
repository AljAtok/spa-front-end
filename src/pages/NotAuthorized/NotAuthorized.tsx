// src/pages/NotAuthorized/NotAuthorized.tsx
import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../styles/theme";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const NotAuthorized: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoHome = () => {
    navigate("/dashboard"); // Go to dashboard
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      sx={{
        textAlign: "center",
        padding: "20px",
      }}
    >
      <LockOutlinedIcon
        sx={{
          fontSize: 80,
          color: colors.redAccent[500],
          mb: 2,
        }}
      />

      <Typography
        variant="h1"
        color={colors.grey[100]}
        fontWeight="bold"
        sx={{ mb: 2 }}
      >
        403
      </Typography>

      <Typography
        variant="h3"
        color={colors.grey[100]}
        fontWeight="bold"
        sx={{ mb: 2 }}
      >
        Access Denied
      </Typography>

      <Typography
        variant="h5"
        color={colors.grey[300]}
        sx={{ mb: 4, maxWidth: 600 }}
      >
        You don't have permission to access this page. Please contact the system
        administrator if you believe this is an error.
      </Typography>

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{
            color: colors.grey[100],
            borderColor: colors.grey[400],
            "&:hover": {
              borderColor: colors.grey[100],
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            },
          }}
        >
          Go Back
        </Button>

        <Button
          variant="contained"
          onClick={handleGoHome}
          sx={{
            backgroundColor: colors.greenAccent[500],
            "&:hover": {
              backgroundColor: colors.greenAccent[600],
            },
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default NotAuthorized;
