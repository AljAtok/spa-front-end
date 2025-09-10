// src/components/DatagridActions.tsx
import { ElementType } from "react";
import { Box, IconButton, Tooltip, IconButtonProps } from "@mui/material"; // Import IconButtonProps

// Define the shape of a single action object
export interface DataGridAction<T> {
  type: string; // Unique identifier for the action (e.g., "edit", "delete")
  tooltip: string | ((rowData: T) => string); // Text for the tooltip
  icon: ElementType | ((rowData: T) => ElementType); // The MUI icon component itself (e.g., EditIcon, DeleteIcon)
  onClick: (rowId: string | number, rowData: T) => void; // Function to call on click, takes rowId and full rowData
  color?: IconButtonProps["color"] | ((rowData: T) => string); // Optional color for the IconButton
  ariaLabel: string | ((rowData: T) => string); // Optional aria-label for accessibility
  showCondition?: (rowData: T) => boolean; // Optional function to conditionally show the button
  text?: string; // Optional text if not using an icon
}

// Define the props for the DatagridActions component
interface DatagridActionsProps<T> {
  rowId: string | number; // The ID of the current row
  actions: DataGridAction<T>[]; // An array of action objects
  rowData: T; // The full data object for the current row
}

// Use React.FC with a generic type <T> to allow rowData to be any shape
const DatagridActions = <T extends { [key: string]: unknown }>(
  props: DatagridActionsProps<T>
) => {
  const { rowId, actions, rowData } = props;
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      {actions.map((action) => {
        // Check for showCondition
        if (action.showCondition && !action.showCondition(rowData)) {
          return null; // Don't render button if condition is false
        }

        // Resolve the actual icon component if action.icon is a function
        const IconComponent =
          typeof action.icon === "function" && action.icon.length === 1
            ? (action.icon as (rowData: T) => React.ElementType)(rowData)
            : (action.icon as React.ElementType | undefined);
        // Resolve tooltip value
        const tooltipValue =
          typeof action.tooltip === "function"
            ? action.tooltip(rowData)
            : action.tooltip;
        // Resolve color value
        const colorValue =
          typeof action.color === "function"
            ? action.color(rowData)
            : action.color;
        // Resolve aria-label value
        const ariaLabelValue =
          typeof action.ariaLabel === "function"
            ? action.ariaLabel(rowData)
            : action.ariaLabel;
        return (
          <Tooltip key={action.type} title={tooltipValue}>
            <IconButton
              onClick={() => action.onClick(rowId, rowData)}
              color={colorValue as IconButtonProps["color"]}
              aria-label={ariaLabelValue}
            >
              {IconComponent ? <IconComponent /> : action.text}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default DatagridActions;
