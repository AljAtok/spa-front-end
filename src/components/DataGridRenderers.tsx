// src/components/DataGridRenderers.tsx
import { GridRenderCellParams, GridValidRowModel } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { formatDateTime } from "@/utils/dateFormatter";

// IMPORTANT: GridValidRowModel is the base interface for all row models in DataGrid.
// All custom row types (like Role, Module) should ideally extend it, or at least be compatible.

// T must be a type that extends GridValidRowModel AND has a 'status_name' property of type string.
export const GenericStatusNameRenderer = <
  T extends GridValidRowModel & { status_name: string }
>(
  params: GridRenderCellParams<T>
) => {
  const statusName = params.row.status_name || "N/A";

  let color = "grey";
  if (statusName === "ACTIVE") color = "green"; // Match backend response casing
  else if (statusName === "INACTIVE") color = "red";
  else if (statusName === "PENDING") color = "orange";
  else if (statusName === "CANCELLED") color = "red";
  else if (statusName === "POSTED") color = "green";

  return (
    <Box
      sx={{
        p: "5px",
        borderRadius: "5px",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        // backgroundColor: color,
        color: color,
        fontWeight: "bold",
        fontSize: "0.8em",
        minWidth: "60px",
      }}
    >
      {statusName}
    </Box>
  );
};

// T must be a type that extends GridValidRowModel AND has a 'created_user' property of type string.
export const GenericCreatedByFullNameRenderer = <
  T extends GridValidRowModel & { created_user: string }
>(
  params: GridRenderCellParams<T>
) => {
  const createdUser = params.row.created_user || "N/A";
  return <Box>{createdUser}</Box>;
};

// T must be a type that extends GridValidRowModel.
// K must be a key of T AND that key's value must be a string (the date string).
// K also needs to extend `string` to be used as a literal string.
interface GenericDateTimeRendererProps<
  T extends GridValidRowModel,
  K extends keyof T & string
> extends GridRenderCellParams<T> {
  // This 'dateField' prop tells the renderer which specific string property on T holds the date.
  dateField: K;
}

export const GenericDateTimeRenderer = <
  T extends GridValidRowModel,
  K extends keyof T & string
>(
  props: GenericDateTimeRendererProps<T, K>
) => {
  const { dateField, row } = props;

  // Access the property dynamically using the key.
  // We assert it as string | undefined because the field might theoretically be missing or null.
  const dateValue = row[dateField] as string | undefined;

  if (!dateValue) {
    return <Box>N/A</Box>;
  }

  try {
    // Add check for "Invalid Date"
    // const date = new Date(dateValue);
    // if (isNaN(date.getTime())) {
    //   throw new Error("Invalid date string");
    // }

    // const formattedDate = date.toLocaleDateString("en-US", {
    //   year: "numeric",
    //   month: "short",
    //   day: "numeric",
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   second: "2-digit",
    //   hour12: false,
    // });
    // return <Box>{formattedDate}</Box>;
    return <Box>{formatDateTime(dateValue)}</Box>;
  } catch (error) {
    console.error(
      `Error formatting date for field '${dateField}':`,
      dateValue,
      error
    );
    return <Box>Invalid Date</Box>;
  }
};

export interface GenericDateRendererProps<
  T extends GridValidRowModel,
  K extends keyof T & string
> extends GridRenderCellParams<T> {
  dateField: K;
  format?: string; // e.g. 'YYYY-MM-DD', 'MM/DD/YYYY', etc.
}

// Generic date renderer for fields that need date in YYYY-MM-DD format
export const GenericDateRenderer = <
  T extends GridValidRowModel,
  K extends keyof T & string
>(
  props: GenericDateRendererProps<T, K>
) => {
  const { dateField, row, format = "YYYY-MM-DD" } = props;
  const dateValue = row[dateField] as string | undefined;
  if (!dateValue) {
    return <Box>N/A</Box>;
  }
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date string");
    }
    let formattedDate = dateValue;
    if (format === "YYYY-MM-DD") {
      formattedDate = date.toISOString().slice(0, 10);
    } else if (format === "MM/DD/YYYY") {
      formattedDate = `${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date
        .getDate()
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    } else if (format === "DD/MM/YYYY") {
      formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    } else if (format === "MMMM YYYY") {
      // Format: Full month name and year, e.g., "January 2024"
      formattedDate = date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
      });
    }
    // Add more formats as needed
    return <Box>{formattedDate}</Box>;
  } catch {
    return <Box>Invalid Date</Box>;
  }
};

// T must be a type that extends GridValidRowModel AND has an array property.
export const GenericArrayListRenderer = <
  T extends GridValidRowModel,
  K extends keyof T & string
>(
  props: GridRenderCellParams<T> & { arrayField: K }
) => {
  const { arrayField, row } = props;

  // Access the array property dynamically using the key.
  const arrayValue = row[arrayField] as string[] | undefined;

  if (!arrayValue || !Array.isArray(arrayValue) || arrayValue.length === 0) {
    return <Box>N/A</Box>;
  }

  // Join array elements with commas and handle long lists
  const displayText = arrayValue.join(", ");

  return (
    <Box
      sx={{
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={displayText} // Show full text on hover
    >
      {displayText}
    </Box>
  );
};

export const GenericObjectArrayFieldRenderer = <
  T extends GridValidRowModel,
  K extends keyof T & string,
  O extends object = Record<string, unknown>
>(
  props: GridRenderCellParams<T> & {
    arrayField: K;
    getDisplayValue: (obj: O) => string;
  }
) => {
  const { arrayField, row, getDisplayValue } = props;
  const arrayValue = row[arrayField] as O[] | undefined;
  if (!arrayValue || !Array.isArray(arrayValue) || arrayValue.length === 0) {
    return <Box>N/A</Box>;
  }
  const displayText = arrayValue.map(getDisplayValue).join(", ");
  return (
    <Box
      sx={{
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={displayText}
    >
      {displayText}
    </Box>
  );
};
