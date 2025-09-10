// src/components/PageLoader.tsx
import React from "react";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { tokens } from "../styles/theme";

interface PageLoaderProps {
  modulename?: string; // Optional string prop
}

const PageLoader: React.FC<PageLoaderProps> = ({ modulename }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        gap: 3,
      }}
    >
      {/* Logo with circular progress around */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <CircularProgress
          size={100}
          thickness={2}
          sx={{
            color: colors.greenAccent[300],
            position: "absolute",
          }}
        />
        <Box
          component="img"
          src="/assets/logo/chooks-icon.png"
          alt="Company Logo"
          sx={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            objectFit: "contain",
            zIndex: 1,
            // backgroundColor: colors.primary[500], // Fallback background
          }}
        />
      </Box>

      <Typography
        variant="h5"
        sx={{
          color: colors.grey[100],
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Loading {!modulename ? "Data" : modulename}...
      </Typography>

      {/* <Typography
        variant="body2"
        sx={{
          color: colors.grey[300],
          textAlign: "center",
          opacity: 0.8,
        }}
      >
        Please wait while we prepare your content
      </Typography> */}
    </Box>
  );
};

export default PageLoader;
