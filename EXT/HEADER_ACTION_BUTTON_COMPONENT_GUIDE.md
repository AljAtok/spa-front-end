# HeaderActionButton Component - Permission-Protected Header Action Buttons

## Problem Solved

**Before HeaderActionButton**, every management page had repetitive permission checking logic for header action buttons:

```tsx
// This pattern was repeated across management pages
actionButton={
  hasAddPermission ? (
    <ActionButton onClick={handleNew} text="New" icon={AddIcon} />
  ) : undefined
}
```

This required:

- Importing `ActionButton`, `AddIcon`, and `useUserPermissions`
- Declaring permission variables (`canAddToModule`, `hasAddPermission`)
- Conditional rendering logic

**After HeaderActionButton**, the same logic is simplified to:

```tsx
actionButton={
  <HeaderActionButton moduleAlias="users" onClick={handleNew} />
}
```

This eliminates **~6 lines of repetitive code** per management page.

## Component API

### Props

| Prop          | Type                  | Required | Description                                |
| ------------- | --------------------- | -------- | ------------------------------------------ |
| `moduleAlias` | `string`              | ✅       | The module alias to check permissions for  |
| `onClick`     | `() => void`          | ✅       | The click handler for the button           |
| `text`        | `string`              | ❌       | Optional button text (defaults to "New")   |
| `icon`        | `React.ComponentType` | ❌       | Optional button icon (defaults to AddIcon) |

### Permission Logic

- **Add Permission Check**: Only renders if user has `canAddToModule(moduleAlias)` permission
- **Automatic Hide**: Returns `undefined` if user lacks permission (no button shown)
- **Consistent Styling**: Uses the same ActionButton component with consistent styling

## Implementation Examples

### 1. Basic Usage (Most Common)

```tsx
// File: src/pages/UserManagement/UserManagement.tsx
<Header
  title="USER MANAGEMENT"
  subtitle="Manage system users"
  actionButton={<HeaderActionButton moduleAlias="users" onClick={handleNew} />}
/>
```

### 2. Custom Text

```tsx
// File: src/pages/ProductManagement/ProductManagement.tsx
<Header
  title="PRODUCT MANAGEMENT"
  subtitle="Manage products"
  actionButton={
    <HeaderActionButton
      moduleAlias="products"
      onClick={handleNew}
      text="Add Product"
    />
  }
/>
```

### 3. Custom Icon

```tsx
import PersonAddIcon from "@mui/icons-material/PersonAdd";

<Header
  title="USER MANAGEMENT"
  subtitle="Manage system users"
  actionButton={
    <HeaderActionButton
      moduleAlias="users"
      onClick={handleNew}
      icon={PersonAddIcon}
    />
  }
/>;
```

## Migration Steps for Existing Management Pages

### Step 1: Import HeaderActionButton

```tsx
// Replace this import
import ActionButton from "../../components/ActionButton";

// With this import
import HeaderActionButton from "../../components/HeaderActionButton";
```

### Step 2: Remove Unused Imports

Remove these imports if they're only used for the header action button:

```tsx
// Remove these if only used for header button
import AddIcon from "@mui/icons-material/Add";
```

### Step 3: Remove Permission Variables

If the page doesn't use `hasAddPermission` elsewhere, remove:

```tsx
// Remove these if not used elsewhere
const { canAddToModule } = useUserPermissions();
const hasAddPermission = canAddToModule("moduleAlias");
```

### Step 4: Update Header Action Button

Replace the conditional action button logic:

```tsx
// Replace this
actionButton={
  hasAddPermission ? (
    <ActionButton onClick={handleNew} text="New" icon={AddIcon} />
  ) : undefined
}

// With this
actionButton={
  <HeaderActionButton moduleAlias="your_module_alias" onClick={handleNew} />
}
```

## Module Aliases Reference

Make sure to use the correct module alias for permission checks:

| Management Page        | Module Alias     | Permission Context        |
| ---------------------- | ---------------- | ------------------------- |
| LocationManagement     | "locations"      | Location permissions      |
| UserManagement         | "users"          | User permissions          |
| CompanyManagement      | "companies"      | Company permissions       |
| RoleManagement         | "roles"          | Role permissions          |
| AccessKeyManagement    | "access-keys"    | Access key permissions    |
| RolePresetsManagement  | "role-presets"   | Role preset permissions   |
| ModuleManagement       | "modules"        | Module permissions        |
| LocationTypeManagement | "location-types" | Location type permissions |
| SystemsManagement      | "systems"        | System permissions        |

## Features

- **Automatic Permission Checks**: Button only appears if user has required permissions
- **Consistent Styling**: Uses the same ActionButton component with standard styling
- **Flexible Text**: Support for custom button text
- **Custom Icons**: Support for different icons beyond the default AddIcon
- **Type Safety**: Full TypeScript support with proper prop validation
- **Zero Configuration**: Works out of the box with sensible defaults

## Benefits

1. **Code Reduction**: Eliminates ~6 lines of repetitive code per management page
2. **Consistency**: Standardized header action button behavior across all management pages
3. **Maintainability**: Single place to update header action button logic
4. **Permission Integration**: Seamless integration with existing permission system
5. **Type Safety**: Full TypeScript support prevents runtime errors
6. **Developer Experience**: Simple, intuitive API with sensible defaults

## Current Status

- ✅ **HeaderActionButton Component**: Created and working
- ✅ **LocationManagement**: Refactored to use HeaderActionButton
- ✅ **UserManagement**: Refactored to use HeaderActionButton
- ✅ **CompanyManagement**: Refactored to use HeaderActionButton
- ✅ **RoleManagement**: Refactored to use HeaderActionButton
- ✅ **AccessKeyManagement**: Refactored to use HeaderActionButton
- ✅ **RolePresetsManagement**: Refactored to use HeaderActionButton
- ✅ **ModuleManagement**: Refactored to use HeaderActionButton
- ✅ **LocationTypeManagement**: Refactored to use HeaderActionButton
- ✅ **SystemsManagement**: Refactored to use HeaderActionButton

## Testing

After implementing HeaderActionButton, verify:

1. **Permission-Based Visibility**: Button only appears when user has required permissions
2. **Click Functionality**: Button click handlers work correctly
3. **Default Styling**: Button appears with consistent styling and default text
4. **Custom Props**: Custom text and icons work when specified
5. **No Unauthorized Access**: Button is hidden for users without permissions

## Integration with ActionButtonsGuard

HeaderActionButton complements the existing ActionButtonsGuard pattern:

- **HeaderActionButton**: Handles "New" buttons in page headers
- **ActionButtonsGuard**: Handles "Edit", "Activate/Deactivate" buttons in data grid rows

Together, they provide complete permission-protected button coverage for management pages.

## Future Enhancements

Potential future improvements:

1. **Multiple Actions**: Support for multiple header action buttons
2. **Button Groups**: Support for dropdown action button groups
3. **Loading States**: Integration with loading states for better UX
4. **Keyboard Shortcuts**: Support for keyboard shortcuts on action buttons

The HeaderActionButton component is now ready for use across all management pages in the application!
