// src/pages/global/Sidebar/SidebarItem.tsx
import { Link } from "react-router-dom";
import { MenuItem } from "react-pro-sidebar";
import { Typography, useTheme } from "@mui/material";
import { tokens } from "../../../styles/theme"; // Adjusted path
import { SidebarItemProps } from "../../../types/SidebarTypes"; // New import for types

const SidebarItem: React.FC<SidebarItemProps> = ({
  title,
  to,
  icon,
  selectedPath,
  setIsSidebarOpen,
  isNonMobile,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isActive = selectedPath === to || (to === "/" && selectedPath === "/"); // Handles active state for '/' correctly

  return (
    <MenuItem
      active={isActive}
      style={{
        color: colors.grey[100],
      }}
      icon={icon}
    >
      <Link
        to={to}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
        onClick={() => {
          if (!isNonMobile) {
            setIsSidebarOpen(false); // Close sidebar after navigation on mobile
          }
        }}
      >
        <Typography>{title}</Typography>
      </Link>
    </MenuItem>
  );
};

export default SidebarItem;
