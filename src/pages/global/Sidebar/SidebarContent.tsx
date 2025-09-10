// src/pages/global/Sidebar/SidebarContent.tsx
import React, { Fragment } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import { SidebarContentProps } from "../../../types/SidebarTypes";
import { useUserPermissions } from "../../../hooks/useUserPermissions";
import { getIconForModule, getIconForGroup } from "../../../utils/iconMapper";
import PageLoader from "../../../components/PageLoader";
import { UserLoggedData } from "@/types/UserTypes";
import { BACKEND_BASE_URL } from "@/config";

const SidebarContent: React.FC<SidebarContentProps> = ({
  isCollapsed,
  isNonMobile,
  isSidebarOpen,
  setIsSidebarOpen,
  currentPath,
  colors,
}) => {
  // Use the custom hook to get user permissions and modules
  const { groupedModules, loading, error, fullUserData } = useUserPermissions();

  // console.log("Full User data.", fullUserData);
  // console.log(
  //   "User first name:",
  //   (fullUserData as { user?: { full_name?: string } })?.user?.full_name
  // );
  // console.log("User access_keys:", fullUserData as { access_keys: object });
  const typedUserData = fullUserData as UserLoggedData | null;
  const currentUser = typedUserData?.user;
  const currentRole = typedUserData?.role;
  const currentAccessKeyName = currentUser?.current_access_key_name;
  const profilePic = currentUser?.profile_pic_url || null;
  const fullName = currentUser?.full_name;
  const roleName = currentRole?.role_name;

  const getFullImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${BACKEND_BASE_URL}${url}`;
  };

  // Show loading state while fetching permissions
  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: colors.primary[400],
          height: "100%",
          width: isNonMobile ? (isCollapsed ? "80px" : "270px") : "270px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PageLoader modulename="Modules" />
      </Box>
    );
  }

  // Show error state if permissions failed to load
  if (error) {
    return (
      <Box
        sx={{
          backgroundColor: colors.primary[400],
          height: "100%",
          width: isNonMobile ? (isCollapsed ? "80px" : "270px") : "270px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <Typography color={colors.redAccent[500]} textAlign="center">
          {error}
        </Typography>
      </Box>
    );
  }

  // Sort parent titles by minimum order_level of their modules
  const sortedParentTitles = Object.keys(groupedModules).sort((a, b) => {
    const aModules = Object.values(groupedModules[a]).flat();
    const bModules = Object.values(groupedModules[b]).flat();
    const aMinOrder = Math.min(...aModules.map((module) => module.order_level));
    const bMinOrder = Math.min(...bModules.map((module) => module.order_level));
    return aMinOrder - bMinOrder;
  });

  return (
    <Box
      sx={{
        // backgroundColor: colors.primary[400],
        height: "100%",
        width: isNonMobile ? (isCollapsed ? "80px" : "270px") : "270px",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,

        // Updated styles for react-pro-sidebar v1.x
      }}
    >
      <Sidebar
        collapsed={isNonMobile ? isCollapsed : false}
        rootStyles={{
          "& .ps-sidebar-container": {
            // This is the new equivalent of .pro-sidebar-inner
            background: `${colors.primary[400]} !important`,
            height: "100%",
            width: isNonMobile ? (isCollapsed ? "80px" : "270px") : "270px",
            display: "flex",
            flexDirection: "column",
          },
          // "& .ps-sidebar-root": {
          //   background: "transparent !important",
          //   height: "100%",
          //   display: "flex",
          //   width: isNonMobile ? (isCollapsed ? "80px" : "270px") : "270px",
          //   flexDirection: "column",
          // },
          "& .ps-menu-icon": {
            backgroundColor: "transparent !important",
          },
          "& .ps-menu-button": {
            padding: "5px 35px 5px 20px !important",
            "& > div": {
              width: "100%",
            },
            "&:hover": {
              color: "#868dfb !important", // Change text color on hover
              backgroundColor: `${colors.primary[400]} !important`,
            },
          },
          // "& .ps-menu-button:hover": {
          //   color: "#868dfb !important",
          // },
          "& .ps-active": {
            color: "#6870fa !important",
            backgroundColor: `${colors.primary[400]} !important`,
          },
        }}
      >
        <Menu>
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => {
              if (isNonMobile) {
                setIsSidebarOpen(!isSidebarOpen); // Desktop: toggle collapse
              } else {
                setIsSidebarOpen(false); // Mobile: close sidebar
              }
            }}
            icon={isNonMobile && isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 5px 0",
              color: colors.grey[100],
            }}
          >
            {(!isCollapsed && isNonMobile) ||
            (!isNonMobile && isSidebarOpen) ? (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h5" color={colors.grey[100]}>
                  {import.meta.env.VITE_SYS_ABBR}
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent this click from bubbling up to the MenuItem itself
                    if (isNonMobile) {
                      setIsSidebarOpen(!isSidebarOpen); // Desktop toggle
                    } else {
                      setIsSidebarOpen(false); // Mobile close
                    }
                  }}
                >
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            ) : null}
          </MenuItem>

          {/* USER PROFILE SECTION */}
          {isSidebarOpen && (
            <Box mb="5px">
              <Box display="flex" justifyContent="center" alignItems="center">
                {profilePic && (
                  <img
                    alt="profile-user"
                    width="80px"
                    height="80px"
                    src={getFullImageUrl(profilePic)}
                    style={{ cursor: "pointer", borderRadius: "50%" }}
                  />
                )}
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h5"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {fullName}
                </Typography>
                <Typography variant="h6" color={colors.greenAccent[500]}>
                  {roleName}
                </Typography>
                <Typography variant="caption" color={colors.grey[100]}>
                  {currentAccessKeyName}
                </Typography>
              </Box>
            </Box>
          )}

          {/* DYNAMIC NAVIGATION BASED ON PERMISSIONS */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            {/* Render dynamic groups based on user permissions with proper ordering */}
            {sortedParentTitles.map((parentTitle) => {
              const menuGroups = groupedModules[parentTitle];

              // Sort menu titles within parent by minimum order_level
              const sortedMenuTitles = Object.keys(menuGroups).sort((a, b) => {
                const aModules = menuGroups[a];
                const bModules = menuGroups[b];
                const aMinOrder = Math.min(
                  ...aModules.map((module) => module.order_level)
                );
                const bMinOrder = Math.min(
                  ...bModules.map((module) => module.order_level)
                );
                return aMinOrder - bMinOrder;
              }); // Check if this parent group contains only dashboard modules
              const allModulesInParent = Object.values(menuGroups).flat();
              const containsOnlyDashboard = allModulesInParent.every(
                (module) => module.module_alias === "dashboard"
              );

              return (
                <Fragment key={`parent-${parentTitle}`}>
                  {/* Typography for parent_title as section header - skip for dashboard-only groups */}
                  {!containsOnlyDashboard && (
                    <Typography
                      variant="body2"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      {parentTitle}
                    </Typography>
                  )}

                  {/* Render each menu_title group within this parent */}
                  {sortedMenuTitles.map((menuTitle) => {
                    const modules = menuGroups[menuTitle];

                    // Skip if no modules in this menu group
                    if (modules.length === 0) return null;

                    // Sort modules within menu group by order_level
                    const sortedModules = [...modules].sort(
                      (a, b) => a.order_level - b.order_level
                    );

                    // If only one module in menu group, render as individual item
                    if (sortedModules.length === 1) {
                      const module = sortedModules[0];
                      return (
                        <SidebarItem
                          key={`single-${module.id}`}
                          title={module.title} // This is module.link_name
                          to={module.to}
                          icon={
                            getIconForModule(module.module_alias) || (
                              <HomeOutlinedIcon />
                            )
                          }
                          selectedPath={currentPath}
                          setIsSidebarOpen={setIsSidebarOpen}
                          isNonMobile={isNonMobile}
                        />
                      );
                    }

                    // Multiple modules in menu group - render as SidebarGroup
                    const groupItems = sortedModules.map((module) => ({
                      title: module.title, // This is module.link_name
                      to: module.to,
                      icon: getIconForModule(module.module_alias) || (
                        <HomeOutlinedIcon />
                      ),
                    }));

                    return (
                      <SidebarGroup
                        key={`group-${menuTitle}`}
                        title={menuTitle} // This is module.menu_title
                        icon={
                          getIconForGroup(menuTitle) || <HomeOutlinedIcon />
                        }
                        items={groupItems}
                        selectedPath={currentPath}
                        setIsSidebarOpen={setIsSidebarOpen}
                        isNonMobile={isNonMobile}
                        isCollapsed={isCollapsed}
                      />
                    );
                  })}
                </Fragment>
              );
            })}

            {/* Show message if no modules available */}
            {Object.keys(groupedModules).length === 0 && (
              <Box sx={{ padding: 2, textAlign: "center" }}>
                <Typography variant="body2" color={colors.grey[300]}>
                  No authorized modules available
                </Typography>
              </Box>
            )}
          </Box>
        </Menu>
      </Sidebar>
    </Box>
  );
};

export default SidebarContent;
