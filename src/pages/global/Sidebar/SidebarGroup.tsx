// src/pages/global/Sidebar/SidebarGroup.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Collapse, useTheme } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { tokens } from "../../../styles/theme";
import SidebarItem from "./SidebarItem";

export interface SidebarGroupItem {
  title: string;
  to: string;
  icon: React.ReactNode;
}

export interface SidebarGroupProps {
  title: string;
  icon: React.ReactNode;
  items: SidebarGroupItem[];
  selectedPath: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isNonMobile: boolean;
  isCollapsed: boolean;
}

const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  icon,
  items,
  selectedPath,
  setIsSidebarOpen,
  isNonMobile,
  isCollapsed,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Check if any item in this group is currently active
  const isGroupActive = items.some((item) => selectedPath === item.to);

  // State for group expansion
  const [isExpanded, setIsExpanded] = useState(isGroupActive);

  // Auto-expand when an item in this group becomes active
  useEffect(() => {
    if (isGroupActive) {
      setIsExpanded(true);
    }
  }, [isGroupActive]);

  // Don't show expand/collapse icon when sidebar is collapsed
  const showExpandIcon = !isCollapsed;

  const handleGroupClick = () => {
    if (!isCollapsed) {
      setIsExpanded(!isExpanded);
    }
  };
  return (
    <Box sx={{ position: "relative" }}>
      {/* Group Header */}
      <Box
        onClick={handleGroupClick}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px",
          cursor: isCollapsed ? "default" : "pointer",
          color: isGroupActive ? "#6870fa" : colors.grey[100],
          backgroundColor: isGroupActive
            ? "rgba(104, 112, 250, 0.1)"
            : "transparent",
          "&:hover": {
            backgroundColor: isCollapsed
              ? "transparent"
              : "rgba(104, 112, 250, 0.05)",
            color: isCollapsed ? colors.grey[100] : "#868dfb",
            "& .sidebar-group-hover": isCollapsed
              ? {
                  opacity: 1,
                  visibility: "visible",
                }
              : {},
          },
          transition: "all 0.3s ease",
          borderRadius: "4px",
          margin: "2px 8px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {icon}
          {!isCollapsed && (
            <Typography variant="h6" fontWeight="500">
              {title}
            </Typography>
          )}
        </Box>
        {showExpandIcon && (
          <Box>{isExpanded ? <ExpandLess /> : <ExpandMore />}</Box>
        )}
      </Box>

      {/* Group Items - Normal expanded state */}
      {!isCollapsed && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2 }}>
            {items.map((item) => (
              <SidebarItem
                key={item.to}
                title={item.title}
                to={item.to}
                icon={item.icon}
                selectedPath={selectedPath}
                setIsSidebarOpen={setIsSidebarOpen}
                isNonMobile={isNonMobile}
              />
            ))}
          </Box>
        </Collapse>
      )}

      {/* Collapsed state hover menu */}
      {isCollapsed && (
        <Box
          className="sidebar-group-hover"
          sx={{
            position: "absolute",
            left: "100%",
            top: 0,
            minWidth: "200px",
            backgroundColor: colors.primary[400],
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
            borderRadius: "0 8px 8px 0",
            opacity: 0,
            visibility: "hidden",
            transition: "all 0.3s ease",
            zIndex: 1000,
            border: `1px solid ${colors.grey[700]}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.grey[700]}`,
              fontWeight: "600",
              color: colors.grey[100],
              backgroundColor: "rgba(104, 112, 250, 0.1)",
            }}
          >
            {title}
          </Typography>
          <Box sx={{ p: 1 }}>
            {items.map((item) => (
              <SidebarItem
                key={item.to}
                title={item.title}
                to={item.to}
                icon={item.icon}
                selectedPath={selectedPath}
                setIsSidebarOpen={setIsSidebarOpen}
                isNonMobile={isNonMobile}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SidebarGroup;
