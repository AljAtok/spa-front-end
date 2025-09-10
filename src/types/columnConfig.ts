// src/types/columnConfig.ts

// Define types for custom renderers to be specified in the config
export type CustomRendererType =
  | "statusName" // Corresponds to GenericStatusNameRenderer
  | "createdUser" // Corresponds to GenericCreatedByFullNameRenderer
  | "dateTime" // Corresponds to GenericDateTimeRenderer
  | "arrayList" // Corresponds to GenericArrayListRenderer
  | "objectArray" // Corresponds to GenericObjectArrayFieldRenderer
  | "extensionCategoryCodes" // Corresponds to ExtensionCategoryCodeListRenderer
  | "date"; // Corresponds to GenericDateRenderer

// Interface for a single dynamic column definition from JSON/API
export interface DynamicColumnConfig {
  field: string; // The property name from data object (e.g., "id", "role_name")
  headerName: string; // Display name for the column header
  flex?: number; // Flex grow factor for the column
  width?: number; // Fixed width for the column
  type?: "string" | "number" | "date" | "boolean"; // Standard MUI DataGrid column types
  cellClassName?: string; // Custom CSS class for cells in this column

  // Optional property to specify which custom renderer to use for this column.
  // This string will map to a specific renderer function in our utility.
  renderer?: CustomRendererType;
  // If a custom renderer needs a specific field key (like GenericDateTimeRenderer's 'dateField'),
  // this property can provide that key dynamically.
  dateFieldKey?: string;
  // Configuration for object array renderer
  objectArrayConfig?: {
    arrayField: string;
    getDisplayValue: (obj: Record<string, unknown>) => string;
  };
  // Value formatter function that controls how the cell value is displayed
  valueFormatter?: (params: { value: unknown }) => string;
  // Optional date format for date renderer
  format?: string;

  // add more properties here to customize columns dynamically, e.g.:
  // sortable?: boolean;
  // filterable?: boolean;
  // editable?: boolean;
  // valueGetter?: string; // Could be a string key to a predefined valueGetter function lookup
}

// Example JSON response for columns might look:
/*
[
  { "field": "id", "headerName": "ID", "width": 70 },
  { "field": "role_name", "headerName": "Role Name", "flex": 1, "cellClassName": "name-column--cell" },
  { "field": "role_level", "headerName": "Role Level", "type": "number", "flex": 0.8 },
  { "field": "status_name", "headerName": "Status", "flex": 0.8, "renderer": "statusName" },
  { "field": "created_user", "headerName": "Created By", "flex": 1, "renderer": "createdUser" },
  { "field": "created_at", "headerName": "Created At", "flex": 1, "renderer": "dateTime", "dateFieldKey": "created_at" },
  // Note: The 'actions' column is usually handled separately as it involves specific handlers.
]
*/
