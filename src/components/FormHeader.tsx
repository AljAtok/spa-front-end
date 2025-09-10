// src/components/FormHeader.tsx
import React from "react"; // Explicitly import React
import { Typography, Box, useTheme, Divider } from "@mui/material";
import { tokens } from "@/styles/theme";

// Define the interface for FormHeader's props
interface FormHeaderProps {
  title: string;
  subtitle?: string; // Subtitle is optional
  actionButton?: React.ReactNode; // actionButton can be any React node (e.g., a Button component)
  // add other props to pass down to the main Box, e.g.:
  // sx?: BoxProps['sx'];
}

const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  subtitle,
  actionButton,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box mb={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box mb="5px">
          <Typography
            variant="h4"
            color={colors.grey[100]}
            fontWeight="bold"
            sx={{ m: "0 0 1px 0" }}
          >
            {title}
          </Typography>
          {subtitle && ( // Only render subtitle if it's provided
            <Typography variant="h6" color={colors.greenAccent[400]}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box>{actionButton}</Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
    </Box>
  );
};

export default FormHeader;
