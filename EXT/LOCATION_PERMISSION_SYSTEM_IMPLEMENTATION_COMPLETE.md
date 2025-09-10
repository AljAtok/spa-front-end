// PERMISSION-BASED LOCATION MANAGEMENT TESTING GUIDE

## 🎯 **PERMISSION SYSTEM IMPLEMENTATION - COMPLETE**

### **✅ FEATURES IMPLEMENTED:**

1. **Module-Level Permission Checking**

   - `canViewModule('locations')` - Controls page access
   - `canAddToModule('locations')` - Controls "New" button visibility
   - `canEditInModule('locations')` - Controls edit button visibility
   - `canActivateInModule('locations')` - Controls activate button visibility
   - `canDeactivateInModule('locations')` - Controls deactivate button visibility

2. **LocationManagement Component Changes:**

   - **Page Access Control**: Redirects to `/not-authorized` if no view permission
   - **New Button**: Only shown if user has add permission
   - **Edit Button**: Only shown if user has edit permission
   - **Toggle Status Button**: Only shown based on activate/deactivate permissions per row

3. **Permission Context Functions Added:**

   ```typescript
   // Generic permission checker
   hasModulePermission(moduleAlias: string, actionName: string): boolean

   // Specific permission checkers
   canViewModule(moduleAlias: string): boolean
   canAddToModule(moduleAlias: string): boolean
   canEditInModule(moduleAlias: string): boolean
   canActivateInModule(moduleAlias: string): boolean
   canDeactivateInModule(moduleAlias: string): boolean
   ```

### **🧪 TESTING SCENARIOS:**

#### **Scenario 1: Full Permissions (Current Mock Data)**

```typescript
// Mock data in UserPermissionsContext.tsx includes:
actions: [
  { action_name: "view", permission_status_id: 1 },
  { action_name: "add", permission_status_id: 1 },
  { action_name: "edit", permission_status_id: 1 },
  { action_name: "activate", permission_status_id: 1 },
  { action_name: "deactivate", permission_status_id: 1 },
];
```

**Expected Behavior:**

- ✅ Can access /locations page
- ✅ "New" button visible in header
- ✅ Edit button visible in all rows
- ✅ Toggle status button visible for all rows (activate/deactivate based on current status)

#### **Scenario 2: View Only Permission**

```typescript
// Modify mock data to only include:
actions: [{ action_name: "view", permission_status_id: 1 }];
```

**Expected Behavior:**

- ✅ Can access /locations page
- ❌ "New" button hidden
- ❌ Edit button hidden in all rows
- ❌ Toggle status button hidden in all rows

#### **Scenario 3: No View Permission**

```typescript
// Modify mock data to have no view permission:
actions: [
  { action_name: "view", permission_status_id: 0 }, // or remove entirely
];
```

**Expected Behavior:**

- ❌ Redirected to `/not-authorized` page
- Shows 403 error with "Access Denied" message

#### **Scenario 4: Partial Permissions**

```typescript
// Modify mock data to include:
actions: [
  { action_name: "view", permission_status_id: 1 },
  { action_name: "edit", permission_status_id: 1 },
  { action_name: "activate", permission_status_id: 1 },
  // No add or deactivate permissions
];
```

**Expected Behavior:**

- ✅ Can access /locations page
- ❌ "New" button hidden
- ✅ Edit button visible in all rows
- ✅ Activate button visible for inactive locations
- ❌ Deactivate button hidden for active locations

### **📂 FILES MODIFIED/CREATED:**

#### **Created:**

- `src/pages/NotAuthorized/NotAuthorized.tsx` - 403 error page
- `src/contexts/UserPermissionsContext.tsx` - Extended with permission functions
- `src/hooks/useUserPermissions.ts` - Extended with permission functions

#### **Modified:**

- `src/pages/LocationManagement/LocationManagement.tsx` - Permission-based UI controls
- `src/App.tsx` - Added `/not-authorized` route

### **🔧 IMPLEMENTATION DETAILS:**

#### **Permission Context Extension:**

```typescript
const hasModulePermission = useCallback(
  (moduleAlias: string, actionName: string): boolean => {
    const module = userModules.find((m) => m.module_alias === moduleAlias);
    if (!module) return false;

    return module.actions.some(
      (action) =>
        action.action_name.toLowerCase() === actionName.toLowerCase() &&
        action.permission_status_id === 1
    );
  },
  [userModules]
);
```

#### **LocationManagement Permission Checks:**

```typescript
// Page access control
if (!hasViewPermission) {
  return <NotAuthorized />;
}

// New button conditional rendering
actionButton={
  hasAddPermission ? (
    <ActionButton onClick={handleNew} text="New" icon={AddIcon} />
  ) : undefined
}

// Edit button conditional rendering
if (hasEditPermission) {
  actions.push({
    type: "edit",
    onClick: handleEdit,
    // ... other properties
  });
}

// Toggle status with per-row permission checking
showCondition: (rowData: Location) => {
  if (rowData.status_id === 1) {
    return hasDeactivatePermission;
  } else {
    return hasActivatePermission;
  }
},
```

### **🎯 USAGE FOR OTHER MODULES:**

This pattern can be easily extended to other management pages:

```typescript
// In any management component
const {
  canViewModule,
  canAddToModule,
  canEditInModule,
  canActivateInModule,
  canDeactivateInModule,
} = useUserPermissions();

// Check permissions for specific modules
const hasViewPermission = canViewModule("users");
const hasAddPermission = canAddToModule("users");
// etc.
```

### **🚀 NEXT STEPS:**

1. **Apply to Other Modules**: Extend this pattern to UserManagement, RoleManagement, etc.
2. **Form-Level Permissions**: Implement field-level restrictions in forms
3. **API-Level Validation**: Ensure backend validates permissions on API calls
4. **Role-Based Testing**: Test with different user roles from actual API responses

### **✅ IMPLEMENTATION STATUS: COMPLETE**

The permission-based LocationManagement is now fully functional with:

- ✅ Page access control
- ✅ Button visibility control
- ✅ Row-level action control
- ✅ Graceful error handling
- ✅ NotAuthorized page integration
- ✅ Complete TypeScript type safety

**Ready for testing and extension to other modules!**
