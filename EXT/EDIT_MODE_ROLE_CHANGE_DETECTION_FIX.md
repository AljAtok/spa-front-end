# Edit Mode Role Change Detection Fix

## Problem Description

The UserForm component had an issue where role-based permissions were overwriting user custom permissions in edit mode, even when the role hadn't changed. This prevented users from preserving their custom permissions when editing other user details.

## Requirements

1. **Edit mode + no role change**: Load and preserve user custom permissions
2. **Edit mode + role changed**: Load role-based permissions for the new role
3. **Create mode**: Continue to work as before with role-based permissions

## Solution Implemented

### 1. Added Original Role Tracking

**File**: `src/pages/UserManagement/UserForm.tsx`

- Added `originalRoleId` state variable to track the user's original role when data is loaded
- Updated `loadUserData()` function to set `originalRoleId` when user data is fetched in edit mode

```typescript
const [originalRoleId, setOriginalRoleId] = useState<number | null>(null);

// In loadUserData function
setOriginalRoleId(data.role.id);
```

### 2. Updated Component Props

- Modified `UserDetailsStep` and `PermissionsMatrixStep` component signatures to accept `originalRoleId`
- Updated wrapper components to pass `originalRoleId` prop

```typescript
const UserDetailsStep: React.FC<
  StepComponentProps<UserFormValues> & { isEditMode?: boolean; originalRoleId?: number | null }
> = ({ values, formikProps, isEditMode = false, originalRoleId = null }) => {
```

### 3. Implemented Smart Role Change Detection

**In UserDetailsStep useEffect (lines ~139-195):**

```typescript
// In edit mode, only load role-based permissions if the role has actually changed
if (isEditMode) {
  if (originalRoleId === null) {
    // Original role not loaded yet, skip for now
    console.log(
      "Original role not loaded yet, skipping role-based permission loading"
    );
    return;
  }

  if (originalRoleId === roleId) {
    // Role hasn't changed, preserve existing user permissions
    console.log(
      "Role hasn't changed in edit mode, preserving user custom permissions"
    );
    return;
  }

  // Role has changed, load new role-based permissions
  console.log(
    `Role changed from ${originalRoleId} to ${roleId}, loading new role-based permissions`
  );
}
```

**In PermissionsMatrixStep useEffect (lines ~469-530):**

Similar logic implemented to handle role-based view and preset data loading.

### 4. Updated Dependency Arrays

Both useEffect hooks now include `originalRoleId` in their dependency arrays to ensure proper re-execution when the original role is loaded.

## Behavior After Fix

### Edit Mode Scenarios

1. **User opens edit form**:

   - Original role ID is stored when user data loads
   - User's custom permissions are displayed

2. **User doesn't change role**:

   - Custom permissions are preserved
   - No role-based permission loading occurs

3. **User changes role**:
   - Role change is detected by comparing current role with original role
   - New role-based permissions are loaded and applied
   - Form updates with the new role's default permissions

### Create Mode

- Works exactly as before
- Role-based permissions load immediately when role is selected
- No impact on existing functionality

## Key Improvements

1. **Intelligent Detection**: Only loads role-based permissions when role actually changes
2. **Performance**: Avoids unnecessary API calls in edit mode when role hasn't changed
3. **User Experience**: Preserves custom permissions that users have configured
4. **Backward Compatibility**: No impact on create mode functionality

## Testing Scenarios

1. **Edit user without changing role**: Verify custom permissions are preserved
2. **Edit user and change role**: Verify new role permissions are loaded
3. **Create new user**: Verify role-based permissions still load on role selection
4. **Edit user with invalid/missing original role**: Verify graceful handling

## Files Modified

- `src/pages/UserManagement/UserForm.tsx`: Main implementation with role change detection logic

## Console Logging

Enhanced logging has been added to track the permission loading behavior:

- Logs when original role is not yet loaded
- Logs when role hasn't changed (permissions preserved)
- Logs when role has changed (new permissions loaded)
- Includes mode information (create vs edit) in logs
