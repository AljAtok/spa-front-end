# Edit Mode Permission Restoration Complete Fix

## Problem Description

The UserForm component had a critical bug in edit mode where role-based permissions were overwriting user custom permissions. The specific issue occurred when:

1. User has original role 3 with custom permissions
2. User changes role to 1 → loads role 1 permissions
3. User changes role back to 3 → **BUG**: Form retained role 1 permissions instead of restoring original user permissions

## Requirements

1. **Edit mode + no role change**: Load and preserve user custom permissions
2. **Edit mode + role changed**: Load role-based permissions for the new role
3. **Edit mode + role changed back to original**: Restore original user custom permissions ✅ **FIXED**
4. **Create mode**: Continue to work as before with role-based permissions

## Root Cause

The previous implementation only tracked the original role ID but did not store the original user permissions. When the role was changed back to the original, the system only checked if the role matched but had no way to restore the actual user permissions that existed before any role changes.

## Complete Solution Implemented

### 1. Added Original Role and Permission Tracking

**File**: `src/pages/UserManagement/UserForm.tsx`

Added two new state variables:

```typescript
const [originalRoleId, setOriginalRoleId] = useState<number | null>(null);
const [originalUserPermissions, setOriginalUserPermissions] = useState<Array<{
  module_ids: number;
  action_ids: number[];
}> | null>(null);
```

Updated `loadUserData()` to store both original role and permissions:

```typescript
// Store the original role ID for comparison in edit mode
setOriginalRoleId(data.role.id);

// Store the original user permissions for restoration when role changes back
setOriginalUserPermissions(userPermissionPresets);
```

### 2. Enhanced Component Props

Updated component signatures to accept original permissions:

```typescript
const UserDetailsStep: React.FC<
  StepComponentProps<UserFormValues> & {
    isEditMode?: boolean;
    originalRoleId?: number | null;
    originalUserPermissions?: Array<{
      module_ids: number;
      action_ids: number[];
    }> | null;
  }
> = ({ values, formikProps, isEditMode = false, originalRoleId = null, originalUserPermissions = null }) => {
```

### 3. Smart Permission Restoration Logic

**In UserDetailsStep useEffect:**

```typescript
if (originalRoleId === roleId) {
  // Role hasn't changed OR role has been changed back to original, restore original user permissions
  console.log(
    "Role is back to original in edit mode, restoring original user custom permissions"
  );

  // Restore original user permissions
  if (originalUserPermissions) {
    formikProps.setFieldValue(
      "user_permission_presets",
      originalUserPermissions
    );
    console.log(
      "🔧 Restored original user permissions:",
      originalUserPermissions
    );
  }

  return;
}
```

**In PermissionsMatrixStep useEffect:**

```typescript
if (originalRoleId === values.role_id) {
  // Role hasn't changed OR role has been changed back to original, restore original user permissions
  console.log(
    "Role is back to original in edit mode, restoring original user custom permissions (PermissionsMatrixStep)"
  );

  // Restore original user permissions
  if (originalUserPermissions) {
    formikProps.setFieldValue(
      "user_permission_presets",
      originalUserPermissions
    );
    console.log(
      "🔧 Restored original user permissions (PermissionsMatrixStep):",
      originalUserPermissions
    );
  }

  setIsRoleBasedView(false);
  setRolePresetData(null);
  return;
}
```

### 4. Updated Dependency Arrays

Both useEffect hooks now include all necessary dependencies:

```typescript
}, [values.role_id, get, isEditMode, originalRoleId, formikProps, originalUserPermissions]);
```

## Behavior Flow After Fix

### Edit Mode Permission Flow

1. **Form Opens**:

   - `loadUserData()` fetches user data from API
   - Stores `originalRoleId` (e.g., role 3)
   - Stores `originalUserPermissions` (user's custom permissions)
   - Form displays user's current permissions

2. **User Changes Role (3 → 1)**:

   - `originalRoleId (3) !== values.role_id (1)` → role changed detected
   - Loads role 1 permissions from API
   - Form updates to show role 1 permissions
   - `originalUserPermissions` still stored in memory

3. **User Changes Role Back (1 → 3)**:

   - `originalRoleId (3) === values.role_id (3)` → original role detected
   - **NEW**: Restores `originalUserPermissions` instead of loading role-based permissions
   - Form displays user's original custom permissions ✅

4. **User Changes Role to Different Role (3 → 2)**:
   - `originalRoleId (3) !== values.role_id (2)` → role changed detected
   - Loads role 2 permissions from API
   - Form updates to show role 2 permissions

### Create Mode (Unchanged)

- Works exactly as before
- No original permissions to track
- Role-based permissions load immediately when role is selected

## Key Technical Improvements

1. **Memory-Based Restoration**: Original permissions stored in component state, no additional API calls needed
2. **Intelligent Detection**: Distinguishes between "never changed" and "changed back to original"
3. **Complete State Management**: Tracks both role and permissions independently
4. **Performance Optimized**: Avoids unnecessary API calls for permission restoration
5. **Form Consistency**: Updates both permission matrix and form values simultaneously

## Testing Scenarios ✅

| Scenario                                        | Expected Behavior                        | Status     |
| ----------------------------------------------- | ---------------------------------------- | ---------- |
| Edit user without changing role                 | Preserve custom permissions              | ✅ Fixed   |
| Edit user and change role                       | Load new role permissions                | ✅ Fixed   |
| Edit user, change role, change back to original | Restore original custom permissions      | ✅ **NEW** |
| Create new user                                 | Load role-based permissions on selection | ✅ Working |
| Multiple role changes in same session           | Correctly track and restore              | ✅ Fixed   |

## Console Logging Enhancement

Enhanced logging provides clear visibility into permission handling:

```
🔧 Edit Mode - User permissions loaded: { userPermissionPresets: [...] }
Role is back to original in edit mode, restoring original user custom permissions
🔧 Restored original user permissions: [...]
Role changed from 3 to 1, loading new role-based permissions
Role is back to original in edit mode, restoring original user custom permissions (PermissionsMatrixStep)
🔧 Restored original user permissions (PermissionsMatrixStep): [...]
```

## Files Modified

- `src/pages/UserManagement/UserForm.tsx`: Complete implementation with original permission tracking and restoration

## Bug Resolution Summary

✅ **FIXED**: Role change cycle (original → different → back to original) now correctly restores user's original custom permissions instead of retaining intermediate role-based permissions.

✅ **ENHANCED**: Permission restoration is memory-based and immediate, providing better user experience.

✅ **MAINTAINED**: All existing functionality for create mode and single role changes continues to work as expected.

The fix ensures that users never lose their carefully configured custom permissions when exploring different role options during editing.
