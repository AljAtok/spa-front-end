// src/components/CustomDataGrid.tsx

import { useState, useEffect } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material"; // Import useMediaQuery
import {
  DataGrid,
  GridColDef,
  DataGridProps,
  // GridToolbar, // Import GridToolbar for column visibility controls
  GridColumnVisibilityModel, // Import the type for column visibility model
} from "@mui/x-data-grid";
import { tokens } from "@/styles/theme";
// import PageLoader from "./PageLoader";

// Define the props for the CustomDataGrid component
interface CustomDataGridProps<T extends object = object> {
  rows: T[];
  columns: GridColDef[];
  getRowId?: DataGridProps<T>["getRowId"];
  initialState?: DataGridProps["initialState"];
  // New prop: An array of field names to hide by default on small screens
  initialMobileHiddenFields?: string[];
  initialNonMobileHiddenFields?: string[];
  [key: string]: unknown; // For other passthrough props
}

const CustomDataGrid = <T extends object = object>({
  rows,
  columns,
  initialMobileHiddenFields = [], // Default to an empty array
  initialNonMobileHiddenFields = [], // Default to an empty array
  ...otherProps // Capture other DataGridProps
}: // Add a prop to control checkbox selection

CustomDataGridProps<T>) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  // const { checkboxSelection: withCheckbox = true } = otherProps as {
  //   checkboxSelection?: boolean;
  // };

  const checkboxSelection =
    typeof otherProps.checkboxSelection === "boolean"
      ? otherProps.checkboxSelection
      : false;

  // Determine if it's a small screen (e.g., mobile)
  // Adjust 'md' breakpoint as per design needs (sm, md, lg)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State to manage column visibility
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});

  // Effect to update column visibility when isMobile changes or columns/hidden fields change
  useEffect(() => {
    const newVisibilityModel: GridColumnVisibilityModel = {};

    if (isMobile) {
      // On mobile, hide specified fields
      initialMobileHiddenFields.forEach((field) => {
        newVisibilityModel[field] = false;
      });
      // Optionally, might want to ensure 'id' or 'role_name' are always visible
      // if (columns.some((col) => col.field === "id")) newVisibilityModel["id"] = true;
    } else {
      // On larger screens, ensure all columns are visible by default
      // (or reset to their original visibility if they were hidden for other reasons)
      if (initialNonMobileHiddenFields) {
        initialNonMobileHiddenFields.forEach((field) => {
          newVisibilityModel[field] = false;
        });
      } else {
        columns.forEach((col) => {
          newVisibilityModel[col.field] = true; // Show all
        });
      }
    }
    setColumnVisibilityModel(newVisibilityModel);
  }, [
    isMobile,
    columns,
    initialMobileHiddenFields,
    initialNonMobileHiddenFields,
  ]);

  // Show loading state when rows are empty or undefined
  // if (!rows || rows.length === 0) {
  //   return (
  //     <Box
  //       display="flex"
  //       alignItems="center"
  //       justifyContent="center"
  //       height="84vh"
  //       color={colors.primary[200]}
  //     >
  //       No data available.
  //     </Box>
  //   );
  // }

  return (
    <Box
      m="5px 0 0 0"
      height="84vh"
      sx={{
        "& .MuiDataGrid-root": {
          border: "none",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "none",
        },
        "& .name-column--cell": {
          color: colors.greenAccent[300],
        },
        "& .MuiDataGrid-columnHeader": {
          // Use !important if needed to override MUI's default styles
          backgroundColor: `${colors.greenAccent[500]} !important`,
          borderBottom: "none",
        },
        "& .MuiDataGrid-virtualScroller": {
          backgroundColor: colors.primary[400],
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "none",
          color: `${colors.primary[200]} !important`,
          backgroundColor: colors.primary[400],
        },
        "& .MuiCheckbox-root": {
          color: `${colors.greenAccent[200]} !important`,
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.primary[100]} !important`,
        },
        // Enable horizontal scrolling for the table on small screens if needed
        // This is a fallback if too many columns are still visible
        overflowX: isMobile ? "auto" : "hidden",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
        pageSizeOptions={[5, 20, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 20 } },
          // merge initial states if passed as props
          ...otherProps.initialState,
        }}
        checkboxSelection={checkboxSelection}
        // Use slots for the toolbar (MUI X DataGrid v6+)
        showToolbar
        // Pass the column visibility model to the DataGrid
        columnVisibilityModel={columnVisibilityModel}
        // Allow user to change visibility (updates local state)
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        {...otherProps} // Pass other props like getRowId
      />
    </Box>
  );
};

export default CustomDataGrid;
