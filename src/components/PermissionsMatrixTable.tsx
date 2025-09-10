import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
} from "@mui/material";
import { Module } from "@/types/ModuleTypes";
import { Action } from "@/types/ActionTypes";
import SearchIcon from "@mui/icons-material/Search";

export interface PermissionsMatrixTableProps {
  title?: string;
  description?: string;
  instructions?: string;
  modules: Module[];
  actions: Action[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isPermissionChecked: (moduleId: number, actionId: number) => boolean;
  onPermissionChange: (
    moduleId: number,
    actionId: number,
    checked: boolean
  ) => void;
  onColumnToggle: (actionId: number) => void;
  onRowToggle: (moduleId: number) => void;
  additionalContent?: React.ReactNode;
  readOnly?: boolean;
}

export const PermissionsMatrixTable: React.FC<PermissionsMatrixTableProps> = ({
  title = "Permissions Matrix",
  description,
  instructions = "Toggle check all columns by clicking the permission header cell, Toggle check all rows by clicking the module name cell.",
  modules,
  actions,
  searchQuery,
  onSearchChange,
  isPermissionChecked,
  onPermissionChange,
  onColumnToggle,
  onRowToggle,
  additionalContent,
  readOnly = false,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {description}
        </Typography>
      )}

      <Typography variant="caption" gutterBottom>
        {instructions}
      </Typography>

      {additionalContent}

      {/* Search Bar */}
      <Box sx={{ mb: 2, mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="Search Modules"
          placeholder="Type to filter modules by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ maxWidth: 400 }}
          InputProps={{
            endAdornment: <SearchIcon />,
          }}
        />
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ padding: "4px", fontWeight: "bold", fontSize: "0.875rem" }}
            >
              MODULE
            </TableCell>
            {actions.map((action) => (
              <TableCell
                key={action.id}
                align="center"
                onClick={readOnly ? undefined : () => onColumnToggle(action.id)}
                sx={{
                  cursor: readOnly ? "not-allowed" : "pointer",
                  userSelect: "none",
                  padding: "4px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                {action.action_name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell
                onClick={readOnly ? undefined : () => onRowToggle(module.id)}
                sx={{
                  cursor: readOnly ? "not-allowed" : "pointer",
                  userSelect: "none",
                  padding: "1px",
                  fontSize: "0.875rem",
                }}
              >
                {module.module_name}
              </TableCell>
              {actions.map((action) => (
                <TableCell
                  key={action.id}
                  align="center"
                  sx={{
                    cursor: readOnly ? "not-allowed" : "pointer",
                    padding: "1px",
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isPermissionChecked(module.id, action.id)}
                    onChange={
                      readOnly
                        ? undefined
                        : (e) =>
                            onPermissionChange(
                              module.id,
                              action.id,
                              e.target.checked
                            )
                    }
                    disabled={readOnly}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
