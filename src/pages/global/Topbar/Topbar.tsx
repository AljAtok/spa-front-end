// src/pages/global/Topbar/Topbar.tsx
import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  Box,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  Autocomplete,
  TextField,
} from "@mui/material";
// Corrected import: ColorModeContext now comes from hooks
import { ColorModeContext } from "../../../hooks/useMode";
// tokens still come from theme.ts
import { tokens } from "../../../styles/theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
// import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { TopbarProps } from "../../../types/TopbarTypes";
import { logout } from "../../../utils/auth";
import { useApi } from "../../../hooks/useApi";
import { useLogoutSetup } from "../../../hooks/useLogoutSetup";
import { useUserPermissions } from "../../../hooks/useUserPermissions";
import AccessKeyModal from "../../../components/AccessKeyModal";
import { UserAccessKeyData, UserLoggedData } from "@/types/UserTypes";
import { fetchPerUserAccessKey } from "@/api/userApi";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar, isNonMobile }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { post } = useApi();
  const { get } = useApi();
  const { fullUserData } = useUserPermissions();
  const navigate = useNavigate();

  // Menu state for person icon dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [accessKeyModalOpen, setAccessKeyModalOpen] = useState(false);
  const [changingAccessKey, setChangingAccessKey] = useState(false);

  const menuOpen = Boolean(anchorEl);

  // Set up logout functionality for axios interceptors
  useLogoutSetup();

  const handlePersonMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePersonMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangeAccessKeyClick = () => {
    setAccessKeyModalOpen(true);
    handlePersonMenuClose();
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handlePersonMenuClose();
  };

  const handleAccessKeyChange = async (accessKeyId: number) => {
    try {
      setChangingAccessKey(true);

      // TODO: Implement API call to change user's default access key
      console.log("🔄 Changing access key to:", accessKeyId);
    } catch (error) {
      console.error("❌ Failed to change access key:", error);
    } finally {
      setChangingAccessKey(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🔄 Logout button clicked");
      // Use the refactored logout function with postFn parameter
      // The logout function will trigger a custom event that App.tsx will handle
      await logout(post);
      console.log("✅ Logout completed successfully");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      // Even if API call fails, trigger the logout event
      window.dispatchEvent(new CustomEvent("authLogout"));
    }
  };
  // Extract access keys from fullUserData
  const typedUserData = fullUserData as UserLoggedData | null;
  // const accessKeys = typedUserData?.access_keys || [];
  const currentUser = typedUserData?.user;
  const currentAccessKeyId = currentUser?.current_access_key;
  // Fetch available access keys when component mounts
  const [userAccessKeyData, setUserAccessKeyData] =
    useState<UserAccessKeyData | null>(null);
  const [loadingAccessKeys, setLoadingAccessKeys] = useState(false);

  useEffect(() => {
    const fetchAvailableAccessKeys = async () => {
      if (!currentUser?.id) return;
      if (!accessKeyModalOpen) return;

      try {
        setLoadingAccessKeys(true);
        const data = await fetchPerUserAccessKey(
          { get },
          currentUser?.id.toString()
        );
        // Validate the data structure before setting it
        if (data && typeof data === "object") {
          setUserAccessKeyData(data);
        } else {
          setUserAccessKeyData(null);
        }
      } catch (error) {
        console.error("Failed to fetch available access keys:", error);
        setUserAccessKeyData(null);
      } finally {
        setLoadingAccessKeys(false);
      }
    };

    fetchAvailableAccessKeys();
  }, [currentUser?.id, get, accessKeyModalOpen]);

  // Types for search
  // Define a type for modules and children
  interface ModuleChild {
    title: string;
    to: string;
    module_alias: string;
  }
  interface ModuleWithChildren {
    title: string;
    to: string;
    module_alias: string;
    children?: ModuleChild[];
  }
  interface ModuleNavOption {
    type: "module";
    label: string;
    value: string;
    alias: string;
  }
  type SearchOption = ModuleNavOption;

  // Flatten modules for search (no group headers, no nesting)
  const { groupedModules } = useUserPermissions();
  const modules: ModuleNavOption[] = useMemo(() => {
    if (!groupedModules) return [];
    const flat: ModuleNavOption[] = [];
    Object.values(groupedModules).forEach((group) => {
      Object.values(group).forEach((arr) => {
        (arr as ModuleWithChildren[]).forEach((m) => {
          flat.push({
            type: "module",
            label: m.title,
            value: m.to,
            alias: m.module_alias,
          });
          if (Array.isArray(m.children)) {
            m.children.forEach((child) => {
              flat.push({
                type: "module",
                label: child.title,
                value: child.to,
                alias: child.module_alias,
              });
            });
          }
        });
      });
    });
    return flat;
  }, [groupedModules]);

  // Search bar state and logic
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Debounced search for modules only
  useEffect(() => {
    if (!searchValue) {
      setSearchOptions([]);
      return;
    }
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      const moduleMatches = modules.filter(
        (m) =>
          m.label?.toLowerCase().includes(searchValue.toLowerCase()) ||
          m.alias?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setSearchOptions(moduleMatches);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, modules]);

  // Autocomplete onChange handler
  type AutocompleteValue = string | ModuleNavOption | null;
  const handleSearchSelect = (
    _event: React.SyntheticEvent,
    value: AutocompleteValue
  ) => {
    if (!value || typeof value === "string") return;
    setSearchDropdownOpen(false);
    setSearchValue("");
    if (value.type === "module") {
      navigate(value.value);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      p={2}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}
    >
      {/* Left side: Hamburger icon (if mobile) AND Search Bar */}
      <Box
        display="flex"
        alignItems="center"
        flexGrow={1}
        maxWidth={isNonMobile ? "400px" : "none"}
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "3px",
        }}
      >
        {!isNonMobile && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
            sx={{ mr: 1 }}
          >
            <MenuOutlinedIcon />
          </IconButton>
        )}
        <Autocomplete
          freeSolo
          open={searchDropdownOpen && searchOptions.length > 0}
          onOpen={() => setSearchDropdownOpen(true)}
          onClose={() => setSearchDropdownOpen(false)}
          options={searchOptions}
          loading={searchLoading}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.label
          }
          onInputChange={(_event, value) => setSearchValue(value)}
          inputValue={searchValue}
          onChange={handleSearchSelect}
          sx={{ minWidth: 0, width: "100%" }}
          PaperComponent={({ children, ...props }) => (
            <Box
              {...props}
              sx={{
                minWidth: 0,
                width: "100%",
                boxShadow: 6,
                borderRadius: 2,
                mt: 1,
                zIndex: 1302,
                position: "absolute",
                left: 0,
                backgroundColor: `#fff`, // solid white background
              }}
            >
              {children}
            </Box>
          )}
          ListboxProps={{
            style: {
              minWidth: 0,
              width: "100%",
              padding: 0,
              zIndex: 1302,
              background: "#fff", // solid white background
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder="Search module or page shortcut..."
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
                sx: { ml: 2, flex: 1, background: "transparent" },
              }}
              sx={{ width: "100%" }}
            />
          )}
          renderOption={(props, option) => (
            <li
              {...props}
              key={option.label}
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                fontWeight: 400,
                fontSize: 15,
                background: `${colors.primary[400]}`,
              }}
            >
              <MenuOutlinedIcon sx={{ mr: 1 }} />
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {option.label}
              </span>
            </li>
          )}
        />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>{" "}
      {/* Right side: Theme toggle, notifications, settings, and profile menu */}
      <Box display="flex" alignItems="center">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <LightModeOutlinedIcon />
          ) : (
            <DarkModeOutlinedIcon />
          )}
        </IconButton>

        {/* <IconButton>
          <NotificationsOutlinedIcon />
        </IconButton>
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton> */}

        {/* Person icon with dropdown menu */}
        <IconButton
          onClick={handlePersonMenuClick}
          sx={{
            color: menuOpen ? colors.greenAccent[500] : colors.grey[100],
          }}
        >
          <PersonOutlinedIcon />
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handlePersonMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              border: `1px solid ${colors.grey[700]}`,
              minWidth: "200px",
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={handleProfileClick}
            sx={{
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.greenAccent[500],
              },
            }}
          >
            <ListItemIcon>
              <PersonOutlinedIcon sx={{ color: colors.grey[100] }} />
            </ListItemIcon>
            <Typography>Profile</Typography>
          </MenuItem>
          <MenuItem
            onClick={handleChangeAccessKeyClick}
            sx={{
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.greenAccent[500],
              },
            }}
          >
            <ListItemIcon>
              <VpnKeyOutlinedIcon sx={{ color: colors.grey[100] }} />
            </ListItemIcon>
            <Typography>Change Access Key</Typography>
          </MenuItem>
        </Menu>

        <IconButton onClick={handleLogout}>
          <ExitToAppOutlinedIcon />
        </IconButton>
      </Box>{" "}
      {/* Access Key Modal */}
      <AccessKeyModal
        open={accessKeyModalOpen}
        onClose={() => setAccessKeyModalOpen(false)}
        userAccessKeyData={userAccessKeyData}
        onAccessKeyChange={handleAccessKeyChange}
        loading={changingAccessKey || loadingAccessKeys}
        currentAccessKeyId={currentAccessKeyId ?? 0}
      />
    </Box>
  );
};

export default Topbar;
