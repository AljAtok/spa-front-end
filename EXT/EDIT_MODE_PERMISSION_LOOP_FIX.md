# Edit Mode Permission Loop Fix

## Problem

After implementing the original permission restoration fix, the console started showing infinite loops with the message:

```
Role is back to original in edit mode, restoring original user custom permissions
```

## Root Cause

The infinite loop was caused by including `formikProps` and `originalUserPermissions` in the useEffect dependency arrays:

```typescript
// PROBLEMATIC - Causes infinite loops
}, [values.role_id, get, isEditMode, originalRoleId, formikProps, originalUserPermissions]);
```

**Why this caused loops:**

1. `formikProps` changes on every render because it's a new object each time
2. When we call `formikProps.setFieldValue()` to restore permissions, it triggers a re-render
3. The re-render creates a new `formikProps` object
4. This triggers the useEffect again because `formikProps` changed
5. The cycle repeats infinitely

## Solution

Remove `formikProps` and `originalUserPermissions` from the dependency arrays and add ESLint disable comments:

```typescript
// FIXED - No more loops
}, [values.role_id, get, isEditMode, originalRoleId]); // Intentionally exclude formikProps and originalUserPermissions to prevent loops
```

## Why This Fix Works

1. **`formikProps` exclusion**: We don't need to react to `formikProps` changes - we only need it for calling `setFieldValue()`
2. **`originalUserPermissions` exclusion**: This value is set once when the component mounts and doesn't change, so we don't need to react to it
3. **Stable dependencies**: The remaining dependencies (`values.role_id`, `get`, `isEditMode`, `originalRoleId`) only change when they should trigger the effect

## Changes Made

### File: `src/pages/UserManagement/UserForm.tsx`

**UserDetailsStep useEffect:**

```typescript
// Before (caused loops)
}, [values.role_id, get, isEditMode, originalRoleId, formikProps, originalUserPermissions]);

// After (fixed)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [values.role_id, get, isEditMode, originalRoleId]); // Intentionally exclude formikProps and originalUserPermissions to prevent loops
```

**PermissionsMatrixStep useEffect:**

```typescript
// Before (caused loops)
}, [values.role_id, get, isEditMode, originalRoleId, formikProps, originalUserPermissions]);

// After (fixed)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [values.role_id, get, isEditMode, originalRoleId]); // Intentionally exclude formikProps and originalUserPermissions to prevent loops
```

## Functional Behavior Preserved

The permission restoration functionality remains exactly the same:

✅ **Edit mode + no role change**: Preserves user custom permissions  
✅ **Edit mode + role changed**: Loads role-based permissions for new role  
✅ **Edit mode + role changed back to original**: Restores original user permissions  
✅ **Create mode**: Works as before with role-based permissions

## Best Practice Notes

This is a common React pattern where:

1. Functions/objects that change on every render should not be in dependency arrays
2. Values that don't change after initial load don't need to be in dependency arrays
3. ESLint disable comments should explain WHY dependencies are excluded

The fix maintains all functionality while eliminating the performance issue and console spam from infinite loops.

## Testing

After this fix:

- ❌ No more infinite console logging
- ✅ Permission restoration still works correctly
- ✅ Role change detection still works correctly
- ✅ All edit mode scenarios work as expected
