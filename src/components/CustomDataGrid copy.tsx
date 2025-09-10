// src/components/CustomDataGrid.tsx

import { Box, useTheme } from "@mui/material";
// Import specific types from @mui/x-data-grid
import { DataGrid, GridColDef, DataGridProps } from "@mui/x-data-grid";
import { tokens } from "@/styles/theme";

// Define the props for the CustomDataGrid component
interface CustomDataGridProps<T extends object = object> {
  //   rows: GridRowsProp; // Array of row objects, typed by @mui/x-data-grid
  rows: T[]; // Now rows will be an array of type T
  columns: GridColDef[]; // Array of column definitions, typed by @mui/x-data-grid
  getRowId?: DataGridProps<T>["getRowId"];
  initialState?: DataGridProps["initialState"];
  [key: string]: unknown;
  // add more props here if want to pass other DataGridProps
  // loading?: boolean;
  // autoPageSize?: boolean;
  // disableColumnFilter?: boolean;
  // ... and so on, by extending DataGridProps if needed.
  // Example: interface CustomDataGridProps extends Partial<DataGridProps> { ... }
}

const CustomDataGrid = <T extends object = object>({
  rows,
  columns,
}: // initialState,
// Destructure other passthrough props here
// ...otherProps // This captures any additional DataGridProps passed
CustomDataGridProps<T>) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  console.log("DataGrid is rendering with rows:", rows);

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
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: { paginationModel: { pageSize: 20 } },
        }}
        checkboxSelection
        showToolbar
        // The `showToolbar` prop should be `slots={{ toolbar: GridToolbar }}` in MUI X DataGrid v6+

        // slots={{ toolbar: GridToolbar }}
      />
    </Box>
  );
};

export default CustomDataGrid;
