# PermissionGuard Component - Reusable Permission and Loading Logic

## Overview

The `PermissionGuard` component is a reusable wrapper that eliminates the repetitive permission checking and loading state logic found across multiple form components. Instead of duplicating the same permission checks in every form, you can wrap your form with this component.

## Problem Solved

**Before PermissionGuard**, every form component had this repetitive code:

```typescript
const {
  canEditInModule,
  canAddToModule,
  loading: permissionsLoading,
} = useUserPermissions();

const hasEditPermission = canEditInModule("modules");
const hasAddPermission = canAddToModule("modules");

if (permissionsLoading) {
  return <PageLoader modulename="Module Form" />;
}

if ((isEditMode && !hasEditPermission) || (!isEditMode && !hasAddPermission)) {
  return <NotAuthorized />;
}

// Form component JSX...
```

**After PermissionGuard**, the same logic is simplified to:

```typescript
return (
  <PermissionGuard
    moduleAlias="modules"
    isEditMode={isEditMode}
    loadingText="Module Form"
  >
    {/* Your form component JSX */}
  </PermissionGuard>
);
```

## Component API

### Props

| Prop          | Type              | Required | Description                                                                       |
| ------------- | ----------------- | -------- | --------------------------------------------------------------------------------- |
| `children`    | `React.ReactNode` | ✅       | The component to render if permissions are valid                                  |
| `moduleAlias` | `string`          | ✅       | The module alias to check permissions for (e.g., "users", "modules", "locations") |
| `isEditMode`  | `boolean`         | ✅       | Whether the form is in edit mode (true) or create mode (false)                    |
| `loadingText` | `string`          | ❌       | Optional custom loading text (defaults to "{moduleAlias} Form")                   |

### Permission Logic

- **Create Mode** (`isEditMode: false`): Checks `canAddToModule(moduleAlias)`
- **Edit Mode** (`isEditMode: true`): Checks `canEditInModule(moduleAlias)`
- **Loading State**: Shows `PageLoader` while permissions are being fetched
- **Unauthorized**: Shows `NotAuthorized` component if user lacks required permission

## Implementation Examples

### 1. ModuleForm (✅ Implemented)

```typescript
// Before
const hasEditPermission = canEditInModule("modules");
const hasAddPermission = canAddToModule("modules");
if (permissionsLoading) {
  return <PageLoader modulename="Module Form" />;
}
if ((isEditMode && !hasEditPermission) || (!isEditMode && !hasAddPermission)) {
  return <NotAuthorized />;
}

// After
return (
  <PermissionGuard
    moduleAlias="modules"
    isEditMode={isEditMode}
    loadingText="Module Form"
  >
    <MultiStepForm<ModuleFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 2. RoleForm (✅ Implemented)

```typescript
return (
  <PermissionGuard
    moduleAlias="roles"
    isEditMode={isEditMode}
    loadingText="Role Form"
  >
    <MultiStepForm<RoleFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 3. UserForm (Recommended Implementation)

```typescript
// File: src/pages/UserManagement/UserForm.tsx
return (
  <PermissionGuard
    moduleAlias="users"
    isEditMode={isEditMode}
    loadingText="User Form"
  >
    <MultiStepForm<UserFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 4. LocationForm (Recommended Implementation)

```typescript
// File: src/pages/LocationManagement/LocationForm.tsx
return (
  <PermissionGuard
    moduleAlias="locations"
    isEditMode={isEditMode}
    loadingText="Location Form"
  >
    <MultiStepForm<LocationFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 5. LocationTypeForm (Recommended Implementation)

```typescript
// File: src/pages/LocationTypeManagement/LocationTypeForm.tsx
return (
  <PermissionGuard
    moduleAlias="location_types"
    isEditMode={isEditMode}
    loadingText="Location Type Form"
  >
    <MultiStepForm<LocationTypeFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 6. CompanyForm (Recommended Implementation)

```typescript
// File: src/pages/CompanyManagement/CompanyForm.tsx
return (
  <PermissionGuard
    moduleAlias="companies"
    isEditMode={isEditMode}
    loadingText="Company Form"
  >
    <MultiStepForm<CompanyFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 7. RolePresetForm (Recommended Implementation)

```typescript
// File: src/pages/RolePresetsManagement/RolePresetForm.tsx
return (
  <PermissionGuard
    moduleAlias="role-presets"
    isEditMode={isEditMode}
    loadingText="Role Preset Form"
  >
    <MultiStepForm<RolePresetFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

### 8. AccessKeyForm (Recommended Implementation)

```typescript
// File: src/pages/AccessKeyManagement/AccessKeyForm.tsx
return (
  <PermissionGuard
    moduleAlias="access-keys" // Note: Check the correct module alias
    isEditMode={isEditMode}
    loadingText="Access Key Form"
  >
    <MultiStepForm<AccessKeyFormValues>
    // ... form props
    />
  </PermissionGuard>
);
```

## Migration Steps for Existing Forms

### Step 1: Import PermissionGuard

```typescript
import PermissionGuard from "../../components/PermissionGuard";
```

### Step 2: Remove Unused Imports

Remove these imports if they're only used for permission checking:

```typescript
// Remove these if only used for permissions
import PageLoader from "@/components/PageLoader";
import NotAuthorized from "../NotAuthorized/NotAuthorized";
import { useUserPermissions } from "@/hooks/useUserPermissions";
```

### Step 3: Remove Permission Context Code

Remove the permission checking logic:

```typescript
// Remove this block
const {
  canEditInModule,
  canAddToModule,
  loading: permissionsLoading,
} = useUserPermissions();

const hasEditPermission = canEditInModule("moduleAlias");
const hasAddPermission = canAddToModule("moduleAlias");

if (permissionsLoading) {
  return <PageLoader modulename="Form Name" />;
}

if ((isEditMode && !hasEditPermission) || (!isEditMode && !hasAddPermission)) {
  return <NotAuthorized />;
}
```

### Step 4: Wrap Return Statement

Wrap your existing form JSX with PermissionGuard:

```typescript
return (
  <PermissionGuard
    moduleAlias="your_module_alias"
    isEditMode={isEditMode}
    loadingText="Your Form Name"
  >
    {/* Your existing form JSX */}
  </PermissionGuard>
);
```

## Module Aliases Reference

Make sure to use the correct module alias for each form:

| Form             | Module Alias                           |
| ---------------- | -------------------------------------- |
| UserForm         | `"users"`                              |
| RoleForm         | `"roles"`                              |
| ModuleForm       | `"modules"`                            |
| LocationForm     | `"locations"`                          |
| LocationTypeForm | `"location_types"`                     |
| CompanyForm      | `"companies"`                          |
| RolePresetForm   | `"role-presets"`                       |
| AccessKeyForm    | `"access-keys"` (verify correct alias) |

## Benefits

1. **Code Reduction**: Eliminates ~15 lines of repetitive code per form
2. **Consistency**: Standardizes permission checking logic across all forms
3. **Maintainability**: Single place to update permission logic if needed
4. **Type Safety**: Strongly typed props ensure correct usage
5. **Reusability**: Works with any form component that follows the pattern

## Testing

After implementing PermissionGuard, verify:

1. **Loading State**: Page shows loading spinner while permissions load
2. **Create Mode**: Users without "add" permission see NotAuthorized
3. **Edit Mode**: Users without "edit" permission see NotAuthorized
4. **Authorized Access**: Users with proper permissions see the form
5. **Error Handling**: Graceful handling of permission loading failures

## Current Status

- ✅ **PermissionGuard Component**: Created and working
- ✅ **ModuleForm**: Refactored to use PermissionGuard
- ✅ **RoleForm**: Refactored to use PermissionGuard
- 🔄 **Other Forms**: Ready for migration using the patterns above

The PermissionGuard component is now ready for use across all form components in the application!
