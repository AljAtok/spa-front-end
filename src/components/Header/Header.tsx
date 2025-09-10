// src/components/Header/Header.tsx
import React from "react";
import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../../styles/theme"; // Adjusted import path for tokens
import { HeaderProps } from "../../types/HeaderTypes"; // Import the defined props
import useMediaQuery from "@mui/material/useMediaQuery";
const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  selectComponent,
  actionButton,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.between("sm", "md"));
  // const isLarge = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box
      display="flex"
      flexDirection={isSmall ? "column" : "row"}
      justifyContent="space-between"
      alignItems={isSmall ? "flex-start" : "center"}
      mb="5px"
      gap={isSmall ? 2 : 0}
    >
      <Box mb={isSmall ? 1 : 0}>
        <Typography
          variant={isSmall ? "h6" : isMedium ? "h5" : "h4"}
          color={colors.grey[100]}
          fontWeight="bold"
          sx={{ m: "0 0 2px 0" }}
        >
          {title}
        </Typography>
        <Typography
          variant={isSmall ? "body2" : isMedium ? "body1" : "h5"}
          color={colors.greenAccent[400]}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        gap={isSmall ? 1 : 2}
        width={isSmall ? "100%" : "auto"}
        justifyContent={isSmall ? "flex-start" : "flex-end"}
      >
        {selectComponent}
        {actionButton}
      </Box>
    </Box>
  );
};

export default Header;
