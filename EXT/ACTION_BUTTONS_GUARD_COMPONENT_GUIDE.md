# ActionButtonsGuard Component - Reusable Action Button Permission Logic

## Problem Solved

**Before ActionButtonsGuard**, every management page had repetitive permission checking logic for action buttons:

```typescript
const buttonActionGrid = useMemo<Array<DataGridAction<Entity>>>(() => {
  const actions: Array<DataGridAction<Entity>> = [];

  // Add edit action only if user has edit permission
  if (hasEditPermission) {
    actions.push({
      type: "edit",
      onClick: handleEdit,
      tooltip: "Edit Entity",
      color: "success",
      icon: EditOutlinedIcon,
      ariaLabel: "edit",
    });
  }

  // Add toggle status action only if user has activate/deactivate permissions
  if (hasActivatePermission || hasDeactivatePermission) {
    actions.push({
      type: "toggleStatus",
      onClick: handleToggleStatus,
      icon: (rowData: Entity) =>
        rowData.status_id === 1 ? ToggleOnOutlinedIcon : ToggleOffOutlinedIcon,
      tooltip: (rowData: Entity) =>
        rowData.status_id === 1 ? "Deactivate Entity" : "Activate Entity",
      color: (rowData: Entity) =>
        rowData.status_id === 1 ? "success" : "warning",
      ariaLabel: (rowData: Entity) =>
        rowData.status_id === 1 ? "deactivate" : "activate",
      showCondition: (rowData: Entity) => {
        if (rowData.status_id === 1) {
          return hasDeactivatePermission;
        } else {
          return hasActivatePermission;
        }
      },
    });
  }

  return actions;
}, [
  handleEdit,
  handleToggleStatus,
  hasEditPermission,
  hasActivatePermission,
  hasDeactivatePermission,
]);
```

**After ActionButtonsGuard**, the same logic is simplified to:

```typescript
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "entities",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Entity",
  activateTooltip: "Activate Entity",
  deactivateTooltip: "Deactivate Entity",
});
```

This eliminates **~40 lines of repetitive code** per management page.

## Component API

### useActionButtonsGuard Hook

```typescript
function useActionButtonsGuard<T extends { status_id: number }>(
  config: ActionButtonsConfig<T>
): DataGridAction<T>[];
```

### Configuration Interface

```typescript
interface ActionButtonsConfig<T> {
  moduleAlias: string; // Module to check permissions for
  editHandler: (id: string | number, rowData: T) => void; // Edit button click handler
  toggleStatusHandler: (id: string | number, rowData: T) => void; // Toggle status click handler
  editTooltip?: string; // Optional edit button tooltip
  activateTooltip?: string | ((rowData: T) => string); // Optional activate tooltip
  deactivateTooltip?: string | ((rowData: T) => string); // Optional deactivate tooltip
}
```

### Permission Logic

- **Edit Action**: Only shown if user has `canEditInModule(moduleAlias)` permission
- **Toggle Status Action**: Only shown if user has `canActivateInModule(moduleAlias)` OR `canDeactivateInModule(moduleAlias)` permission
- **Individual Button Visibility**:
  - Deactivate button shown only if row status is active AND user has deactivate permission
  - Activate button shown only if row status is inactive AND user has activate permission

## Implementation Examples

### 1. LocationManagement (✅ Implemented)

```typescript
// Before (40+ lines)
const { canEditInModule, canActivateInModule, canDeactivateInModule } =
  useUserPermissions();

const hasEditPermission = canEditInModule("locations");
const hasActivatePermission = canActivateInModule("locations");
const hasDeactivatePermission = canDeactivateInModule("locations");

const buttonActionGrid = useMemo<Array<DataGridAction<Location>>>(() => {
  // ... 35+ lines of action button logic
}, [
  handleEdit,
  handleToggleStatus,
  hasEditPermission,
  hasActivatePermission,
  hasDeactivatePermission,
]);

// After (7 lines)
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "locations",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Location",
  activateTooltip: "Activate Location",
  deactivateTooltip: "Deactivate Location",
});
```

### 2. UserManagement (✅ Implemented)

```typescript
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "users",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit User",
  activateTooltip: "Activate User",
  deactivateTooltip: "Deactivate User",
});
```

### 3. CompanyManagement (✅ Implemented)

```typescript
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "companies",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Company",
  activateTooltip: "Activate Company",
  deactivateTooltip: "Deactivate Company",
});
```

### 4. RoleManagement (Recommended Implementation)

```typescript
// File: src/pages/RoleManagement/RoleManagement.tsx
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "roles",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Role",
  activateTooltip: "Activate Role",
  deactivateTooltip: "Deactivate Role",
});
```

### 5. AccessKeyManagement (Recommended Implementation)

```typescript
// File: src/pages/AccessKeyManagement/AccessKeyManagement.tsx
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "access-keys", // Note: Verify correct module alias
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Access Key",
  activateTooltip: "Activate Access Key",
  deactivateTooltip: "Deactivate Access Key",
});
```

### 6. RolePresetsManagement (Recommended Implementation)

```typescript
// File: src/pages/RolePresetsManagement/RolePresetsManagement.tsx
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "role-presets",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Role Preset",
  activateTooltip: "Activate Role Preset",
  deactivateTooltip: "Deactivate Role Preset",
});
```

## Module Aliases Reference

Make sure to use the correct module alias for permission checks:

| Management Page       | Module Alias   | Permission Context      |
| --------------------- | -------------- | ----------------------- |
| LocationManagement    | "locations"    | Location permissions    |
| UserManagement        | "users"        | User permissions        |
| CompanyManagement     | "companies"    | Company permissions     |
| RoleManagement        | "roles"        | Role permissions        |
| AccessKeyManagement   | "access-keys"  | Access key permissions  |
| RolePresetsManagement | "role-presets" | Role preset permissions |
| ModuleManagement      | "modules"      | Module permissions      |

## Migration Steps for Existing Management Pages

### Step 1: Add Import

```typescript
import { useActionButtonsGuard } from "../../components/ActionButtonsGuard";
```

### Step 2: Replace buttonActionGrid

Find the existing `buttonActionGrid` definition and replace it with:

```typescript
const buttonActionGrid = useActionButtonsGuard({
  moduleAlias: "your_module_alias",
  editHandler: handleEdit,
  toggleStatusHandler: handleToggleStatus,
  editTooltip: "Edit Your Entity",
  activateTooltip: "Activate Your Entity",
  deactivateTooltip: "Deactivate Your Entity",
});
```

### Step 3: Remove Unused Imports

Remove these imports that are no longer needed:

```typescript
// Remove these
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import { DataGridAction } from "../../components/DatagridActions";
```

### Step 4: Remove Unused Permission Variables

If the page doesn't use permissions elsewhere, remove:

```typescript
// Remove these if not used elsewhere
const { canEditInModule, canActivateInModule, canDeactivateInModule } =
  useUserPermissions();

const hasEditPermission = canEditInModule("module");
const hasActivatePermission = canActivateInModule("module");
const hasDeactivatePermission = canDeactivateInModule("module");
```

### Step 5: Update useMemo Dependencies

The new `buttonActionGrid` from `useActionButtonsGuard` automatically handles memoization, so you can remove the old `useMemo` wrapper.

## Features

- **Automatic Permission Checks**: Buttons only appear if user has required permissions
- **Dynamic Tooltips**: Support for static strings or dynamic functions based on row data
- **Status-Based Visibility**: Activate/deactivate buttons shown based on current status and permissions
- **Consistent Styling**: Standardized colors, icons, and accessibility labels
- **Type Safety**: Full TypeScript support with generic type parameters
- **Performance**: Built-in memoization for optimal re-render behavior

## Benefits

1. **Code Reduction**: Eliminates ~40 lines of repetitive code per management page
2. **Consistency**: Standardized action button behavior across all management pages
3. **Maintainability**: Single source of truth for action button logic
4. **Permission Integration**: Seamless integration with existing permission system
5. **Type Safety**: Full TypeScript support prevents runtime errors
6. **Customization**: Flexible tooltip configuration for different entities

## Current Status

- ✅ **ActionButtonsGuard Component**: Created and working
- ✅ **LocationManagement**: Refactored to use ActionButtonsGuard
- ✅ **UserManagement**: Refactored to use ActionButtonsGuard
- ✅ **CompanyManagement**: Refactored to use ActionButtonsGuard
- 🔄 **Other Management Pages**: Ready for migration using the patterns above

## Testing

After implementing ActionButtonsGuard, verify:

1. **Permission-Based Visibility**: Buttons only appear when user has required permissions
2. **Status-Based Actions**: Activate/deactivate buttons show correctly based on row status
3. **Tooltip Accuracy**: Tooltips display appropriate text for each action
4. **Click Handlers**: Edit and toggle status handlers function correctly
5. **Performance**: No unnecessary re-renders or permission checks

The ActionButtonsGuard component is now ready for use across all management pages in the application!
