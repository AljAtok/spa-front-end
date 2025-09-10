import React from "react";
import { Box, useTheme, Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";
import { tokens } from "../../../styles/theme";
import SidebarContent from "./SidebarContent";
import { SidebarProps } from "../../../types/SidebarTypes";

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isNonMobile,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();
  const currentPath = location.pathname;
  // isCollapsed only applies to desktop (isNonMobile), otherwise it's always false for mobile drawer
  const isCollapsed = isNonMobile ? !isSidebarOpen : false;

  // Removed the reload logic to prevent freezing on mobile
  if (!isNonMobile) {
    console.log("Entering mobile mode");
  }

  return (
    <>
      {isNonMobile ? (
        // Desktop Sidebar (sticky)
        <Box
          sx={{
            position: "sticky",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 1,
            width: isSidebarOpen ? "270px" : "80px",
            transition: "width 0.3s ease-in-out",
            flexShrink: 0,
          }}
        >
          <SidebarContent
            isCollapsed={isCollapsed}
            isNonMobile={isNonMobile}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentPath={currentPath}
            colors={colors}
          />
        </Box>
      ) : (
        // Mobile Sidebar (Drawer)
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          PaperProps={{
            sx: {
              width: "270px",
              backgroundColor: colors.primary[400],
            },
          }}
          sx={{
            "& .MuiDrawer-paper": {
              width: "270px",
              boxSizing: "border-box",
            },
          }}
        >
          <SidebarContent
            isCollapsed={isCollapsed}
            isNonMobile={isNonMobile}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentPath={currentPath}
            colors={colors}
          />
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
