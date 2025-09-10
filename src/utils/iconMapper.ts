// src/utils/iconMapper.ts
import React from "react";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import DatasetOutlinedIcon from "@mui/icons-material/DatasetOutlined";
import ApiOutlinedIcon from "@mui/icons-material/ApiOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FiberManualRecordOutlinedIcon from "@mui/icons-material/FiberManualRecordOutlined";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

import CallToActionOutlinedIcon from "@mui/icons-material/CallToActionOutlined";

/**
 * Maps module aliases to their corresponding MUI icons
 */
export const getIconForModule = (moduleAlias: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    // Dashboard
    dashboard: React.createElement(HomeOutlinedIcon),

    // User Management
    users: React.createElement(ContactsOutlinedIcon),
    roles: React.createElement(SecurityOutlinedIcon),
    "role-presets": React.createElement(AdminPanelSettingsOutlinedIcon),
    "user-management": React.createElement(PeopleOutlinedIcon),
    profile: React.createElement(PersonIcon),

    // System Configuration
    companies: React.createElement(BusinessOutlinedIcon),
    "access-keys": React.createElement(VpnKeyOutlinedIcon),
    modules: React.createElement(DatasetOutlinedIcon),
    "system-config": React.createElement(SettingsOutlinedIcon),

    // Location Management
    locations: React.createElement(LocationOnOutlinedIcon),
    "location-types": React.createElement(CategoryOutlinedIcon),

    // API Management
    "api-management": React.createElement(ApiOutlinedIcon),
    "api-logs": React.createElement(VpnKeyOutlinedIcon),

    // System Management
    "systems-management": React.createElement(DashboardOutlinedIcon),
    "system-management": React.createElement(DashboardOutlinedIcon),

    // Data Management
    "master-data": React.createElement(InventoryOutlinedIcon),
    "master-data-objects": React.createElement(InventoryOutlinedIcon),
    "master-data-versions": React.createElement(InventoryOutlinedIcon),
    "master-data-versioning": React.createElement(InventoryOutlinedIcon),
    "approval-processes": React.createElement(ChecklistIcon),
    "approval-process": React.createElement(ChecklistIcon),

    // Logs
    "user-logs": React.createElement(HistoryIcon),

    // Incentive Reports
    "incentive-reports": React.createElement(AssessmentIcon),
    "incentive-trans-report": React.createElement(AssessmentIcon),
    "incentive-trans-dashboard": React.createElement(DashboardIcon),

    "incentive-transactions": React.createElement(
      AccountBalanceWalletOutlinedIcon
    ),

    "sales-transactions": React.createElement(CallToActionOutlinedIcon),
    "sales-budget-transactions": React.createElement(CallToActionOutlinedIcon),

    // Default fallback
    default: React.createElement(FiberManualRecordOutlinedIcon, {
      fontSize: "small",
    }),
  };

  const icon = iconMap[moduleAlias.toLowerCase()] || iconMap["default"];

  // Debug logging
  if (!iconMap[moduleAlias.toLowerCase()]) {
    console.warn(
      `No icon found for module alias: ${moduleAlias}, using default`
    );
  }

  return icon;
};

/**
 * Maps parent titles to their corresponding group icons
 */
export const getIconForGroup = (parentTitle: string): React.ReactNode => {
  const groupIconMap: Record<string, React.ReactNode> = {
    core: React.createElement(HomeOutlinedIcon),
    "user configuration": React.createElement(PeopleOutlinedIcon),
    "users config": React.createElement(PeopleOutlinedIcon),
    "system configuration": React.createElement(SettingsOutlinedIcon),
    "systems config": React.createElement(SettingsOutlinedIcon),
    data: React.createElement(InventoryOutlinedIcon),
    "data management": React.createElement(InventoryOutlinedIcon),
    api: React.createElement(ApiOutlinedIcon),
    "api management": React.createElement(ApiOutlinedIcon),
    location: React.createElement(LocationOnOutlinedIcon),
    "location management": React.createElement(LocationOnOutlinedIcon),
    "locations config": React.createElement(LocationOnOutlinedIcon),
    logs: React.createElement(HistoryIcon),
    incentives: React.createElement(AssessmentIcon),
    "incentive management": React.createElement(AssessmentIcon),
    default: React.createElement(DatasetOutlinedIcon),
  };

  const icon =
    groupIconMap[parentTitle.toLowerCase()] || groupIconMap["default"];

  // Debug logging
  if (!groupIconMap[parentTitle.toLowerCase()]) {
    console.warn(`No icon found for group: ${parentTitle}, using default`);
  }

  return icon;
};
