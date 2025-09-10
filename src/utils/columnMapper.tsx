// src/utils/columnMapper.ts

import {
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { DynamicColumnConfig } from "../types/columnConfig";

// Import generic renderers
import {
  GenericStatusNameRenderer,
  GenericCreatedByFullNameRenderer,
  GenericDateTimeRenderer,
  GenericArrayListRenderer,
  GenericObjectArrayFieldRenderer,
  GenericDateRenderer,
} from "../components/DataGridRenderers";

/**
 * Maps an array of dynamic column configurations to MUI X DataGrid's GridColDef format.
 *
 * @param dynamicConfig An array of column configuration objects.
 * @returns An array of GridColDef suitable for MUI X DataGrid.
 */
export const mapColumnConfigToGridColDef = <T extends GridValidRowModel>(
  dynamicConfig: DynamicColumnConfig[]
): GridColDef<T>[] => {
  const gridColDefs: GridColDef<T>[] = dynamicConfig.map((config) => {
    const colDef: GridColDef<T> = {
      // FIX 1: Explicitly cast config.field to 'keyof T & string'
      field: config.field as keyof T & string,
      headerName: config.headerName,
      flex: config.flex,
      width: config.width,
      type: config.type,
      cellClassName: config.cellClassName,
      sortable: true,
      filterable: true,
    };

    // Apply custom renderers based on the 'renderer' property in the config
    switch (config.renderer) {
      case "statusName":
        // FIX 2: Create a type alias for the specific row structure required by GenericStatusNameRenderer
        type RowWithStatusName = T & { status_name: string };
        colDef.renderCell = (params: GridRenderCellParams<T>) => (
          // Cast the entire params object to the expected type for GenericStatusNameRenderer
          // tells TypeScript that for this specific column, params.row will have 'status_name'.
          <GenericStatusNameRenderer
            {...(params as GridRenderCellParams<RowWithStatusName>)}
          />
        );
        break;

      case "createdUser":
        // FIX 2: Create a type alias for the specific row structure required by GenericCreatedByFullNameRenderer
        type RowWithCreatedUser = T & { created_user: string };
        colDef.renderCell = (params: GridRenderCellParams<T>) => (
          // Cast the entire params object to the expected type for GenericCreatedByFullNameRenderer
          <GenericCreatedByFullNameRenderer
            {...(params as GridRenderCellParams<RowWithCreatedUser>)}
          />
        );
        break;

      case "dateTime":
        if (config.dateFieldKey) {
          const dateField = config.dateFieldKey as keyof T & string;
          // FIX 2: Create a type alias for the specific row structure required by GenericDateTimeRenderer
          type RowWithSpecificDateField = T & {
            [K in typeof dateField]: string;
          };

          colDef.renderCell = (params: GridRenderCellParams<T>) => (
            // Cast the entire params object and specify the generic types for GenericDateTimeRenderer
            <GenericDateTimeRenderer<RowWithSpecificDateField, typeof dateField>
              {...(params as GridRenderCellParams<RowWithSpecificDateField>)}
              dateField={dateField}
            />
          );
        } else {
          console.warn(
            `Dynamic column for field '${config.field}' has renderer 'dateTime' but no 'dateFieldKey'.`
          );
        }
        break;

      case "date":
        if (config.dateFieldKey) {
          const dateField = config.dateFieldKey as keyof T & string;
          type RowWithSpecificDateField = T & {
            [K in typeof dateField]: string;
          };
          colDef.renderCell = (params: GridRenderCellParams<T>) => (
            <GenericDateRenderer<RowWithSpecificDateField, typeof dateField>
              {...(params as GridRenderCellParams<RowWithSpecificDateField>)}
              dateField={dateField}
              format={config.format}
            />
          );
        } else {
          console.warn(
            `Dynamic column for field '${config.field}' has renderer 'date' but no 'dateFieldKey'.`
          );
        }
        break;

      case "arrayList": {
        const arrayField = config.field as keyof T & string;
        type RowWithArrayField = T & {
          [K in typeof arrayField]: string[];
        };
        colDef.renderCell = (params: GridRenderCellParams<T>) => (
          <GenericArrayListRenderer<RowWithArrayField, typeof arrayField>
            {...(params as GridRenderCellParams<RowWithArrayField>)}
            arrayField={arrayField}
          />
        );
        break;
      }

      case "extensionCategoryCodes": {
        // For extension_categories array of objects
        colDef.renderCell = (params: GridRenderCellParams<T>) => (
          <GenericObjectArrayFieldRenderer
            {...params}
            arrayField={config.field as keyof T & string}
            getDisplayValue={(cat: { item_category_code: string }) =>
              cat.item_category_code
            }
          />
        );
        break;
      }

      case "objectArray": {
        if (config.objectArrayConfig) {
          const { arrayField, getDisplayValue } = config.objectArrayConfig;
          colDef.renderCell = (params: GridRenderCellParams<T>) => (
            <GenericObjectArrayFieldRenderer
              {...params}
              arrayField={arrayField as keyof T & string}
              getDisplayValue={getDisplayValue}
            />
          );
        } else {
          console.warn(
            `Dynamic column for field '${config.field}' has renderer 'objectArray' but no 'objectArrayConfig'.`
          );
        }
        break;
      }
    }

    return colDef;
  });

  return gridColDefs;
};
