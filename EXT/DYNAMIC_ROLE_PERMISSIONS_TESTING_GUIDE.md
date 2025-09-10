# Dynamic Role-Based Permission Fetching - Testing Guide

## 🧪 Testing Checklist

### **Setup Requirements**

- ✅ UserForm component implemented with dynamic role permissions
- ✅ API endpoint: `GET /role-presets/nested/:role_id` (backend required)
- ✅ All type definitions in place
- ✅ Error handling implemented

### **Test Scenarios**

## 1. **Role Selection Triggers Permission Fetching**

### Test Case 1.1: Valid Role Selection

**Steps:**

1. Navigate to `/user-form`
2. Select a role from the role dropdown
3. Observe console logs and form behavior

**Expected Results:**

- ✅ Console log: "Fetching permissions for role: [roleId]"
- ✅ API call made to `/role-presets/nested/[roleId]`
- ✅ Location multi-select auto-populates with role's locations
- ✅ Permission matrix updates to show role's modules and actions
- ✅ Permissions pre-checked based on role defaults

**Console Logs to Check:**

```
Fetching permissions for role: 1
Role preset data received: {role_id: 1, modules: [...], locations: [...]}
Updated form with role-based data: {locationIds: [...], permissionPresets: [...]}
Role-based data loaded: {modules: 3, actions: 5}
```

### Test Case 1.2: Role Change

**Steps:**

1. Select one role, then change to another role
2. Observe form updates

**Expected Results:**

- ✅ Previous selections cleared
- ✅ New role's data populated
- ✅ Permission matrix updates to new role's modules/actions

### Test Case 1.3: No Role Selected

**Steps:**

1. Clear role selection or select "None"
2. Observe form behavior

**Expected Results:**

- ✅ Locations cleared
- ✅ Permissions cleared
- ✅ Matrix shows all available modules/actions

## 2. **Location Auto-Population**

### Test Case 2.1: Role with Locations

**Steps:**

1. Select a role that has associated locations
2. Check location multi-select field

**Expected Results:**

- ✅ Location multi-select auto-populates with role's locations
- ✅ Only role-specific locations shown as selected
- ✅ User can add/remove additional locations if needed

### Test Case 2.2: Role without Locations

**Steps:**

1. Select a role with no associated locations
2. Check location multi-select field

**Expected Results:**

- ✅ Location multi-select remains empty
- ✅ User can manually select locations
- ✅ No errors displayed

## 3. **Dynamic Permission Matrix**

### Test Case 3.1: Role-Based Matrix Display

**Steps:**

1. Select a role with specific modules and actions
2. Navigate to Permissions Matrix step
3. Observe matrix content

**Expected Results:**

- ✅ Matrix shows role-specific modules as rows
- ✅ Matrix shows role-specific actions as columns
- ✅ Permissions are pre-checked based on role defaults
- ✅ Info message: "📋 Role-based permissions are pre-populated..."

### Test Case 3.2: Permission Customization

**Steps:**

1. With role selected, uncheck some pre-checked permissions
2. Check some unchecked permissions
3. Navigate to Review step

**Expected Results:**

- ✅ Permission changes are saved
- ✅ Custom permissions override role defaults
- ✅ Review step shows custom permission configuration
- ✅ Warning message: "⚠️ Custom permissions will override role-based defaults"

### Test Case 3.3: All Modules/Actions View

**Steps:**

1. No role selected or role with no preset data
2. Navigate to Permissions Matrix step

**Expected Results:**

- ✅ Matrix shows all available modules and actions
- ✅ No pre-checked permissions
- ✅ Standard permission configuration message

## 4. **Error Handling**

### Test Case 4.1: API Error Response

**Steps:**

1. Mock API to return error for role preset fetch
2. Select a role
3. Observe error handling

**Expected Results:**

- ✅ Console error logged
- ✅ Permissions cleared to allow manual configuration
- ✅ User can still configure permissions manually
- ✅ No form crashes or TypeScript errors

### Test Case 4.2: Invalid Role ID

**Steps:**

1. Mock API to return 404 for invalid role
2. Select role
3. Observe behavior

**Expected Results:**

- ✅ Graceful error handling
- ✅ Form continues to function
- ✅ Manual permission configuration available

### Test Case 4.3: Malformed API Response

**Steps:**

1. Mock API to return invalid data structure
2. Select role
3. Check error handling

**Expected Results:**

- ✅ Type-safe error handling
- ✅ Default fallback behavior
- ✅ No runtime errors

## 5. **Form Submission**

### Test Case 5.1: Create User with Role-Based Permissions

**Steps:**

1. Fill user details and select role
2. Allow role-based permissions to populate
3. Submit form
4. Check API payload

**Expected Results:**

- ✅ Payload includes role-based location_ids
- ✅ Payload includes role-based user_permission_presets
- ✅ New optional fields included if present
- ✅ Proper JSON structure maintained

### Test Case 5.2: Create User with Custom Permissions

**Steps:**

1. Select role and let it populate
2. Modify permissions in matrix
3. Submit form
4. Check API payload

**Expected Results:**

- ✅ Custom permissions override role defaults
- ✅ Only selected permissions included in payload
- ✅ Correct module_ids and action_ids structure

### Test Case 5.3: Edit User with Role Change

**Steps:**

1. Edit existing user
2. Change role to different one
3. Allow new role data to populate
4. Submit form

**Expected Results:**

- ✅ New role's data populates
- ✅ Previous custom permissions cleared
- ✅ Update API called with new data

## 6. **Review Step Validation**

### Test Case 6.1: Role Inheritance Display

**Steps:**

1. Select role and navigate to Review step
2. Check permission configuration section

**Expected Results:**

- ✅ Shows role inheritance message
- ✅ Custom permissions listed if any
- ✅ Clear indication of permission source

### Test Case 6.2: No Custom Permissions

**Steps:**

1. Select role, don't modify permissions
2. Navigate to Review step

**Expected Results:**

- ✅ Message: "No custom permissions configured. User will inherit all permissions from the selected role."
- ✅ Role inheritance information displayed

## 7. **Type Safety Validation**

### Test Case 7.1: TypeScript Compilation

**Steps:**

1. Run TypeScript compiler
2. Check for compilation errors

**Expected Results:**

- ✅ No TypeScript errors
- ✅ All types properly defined
- ✅ Type conversion functions working

### Test Case 7.2: Runtime Type Safety

**Steps:**

1. Test with various API response formats
2. Check type conversion functions

**Expected Results:**

- ✅ Proper type conversion from NestedRolePreset to display types
- ✅ No runtime type errors
- ✅ Graceful handling of missing properties

## 8. **Performance Testing**

### Test Case 8.1: Multiple Role Changes

**Steps:**

1. Rapidly change between different roles
2. Observe performance and memory usage

**Expected Results:**

- ✅ No memory leaks
- ✅ Efficient re-rendering
- ✅ Proper cleanup of previous data

### Test Case 8.2: Large Permission Matrix

**Steps:**

1. Test with role having many modules and actions
2. Check rendering performance

**Expected Results:**

- ✅ Smooth rendering
- ✅ Efficient checkbox state management
- ✅ No UI lag

## 🔧 Mock Data for Testing

### Sample Role Preset Response

```json
{
  "role_id": 1,
  "role": {
    "id": 1,
    "role_name": "Admin",
    "role_level": 1,
    "status_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "modified_at": "2024-01-01T00:00:00Z"
  },
  "modules": [
    {
      "id": 1,
      "module_name": "User Management",
      "module_alias": "users",
      "module_link": "/users",
      "menu_title": "Users",
      "parent_title": "Administration",
      "link_name": "Manage Users",
      "status_id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "modified_at": "2024-01-01T00:00:00Z",
      "actions": [
        {
          "id": 1,
          "action_name": "Create",
          "status_id": 1
        },
        {
          "id": 2,
          "action_name": "Read",
          "status_id": 1
        },
        {
          "id": 3,
          "action_name": "Update",
          "status_id": 1
        },
        {
          "id": 4,
          "action_name": "Delete",
          "status_id": 1
        }
      ]
    }
  ],
  "locations": [
    {
      "id": 1,
      "location_name": "Head Office",
      "status_id": 1
    },
    {
      "id": 2,
      "location_name": "Branch 1",
      "status_id": 1
    }
  ],
  "status": {
    "id": 1,
    "status_name": "Active"
  },
  "created_by": {
    "id": 1,
    "user_name": "admin",
    "first_name": "System",
    "last_name": "Admin",
    "full_name": "System Admin"
  },
  "updated_by": {
    "id": 1,
    "user_name": "admin",
    "first_name": "System",
    "last_name": "Admin",
    "full_name": "System Admin"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "modified_at": "2024-01-01T00:00:00Z"
}
```

## 🚀 Next Steps

1. **Backend API Implementation**: Implement the actual `/role-presets/nested/:role_id` endpoint
2. **Integration Testing**: Test with real backend API
3. **User Acceptance Testing**: Get feedback from end users
4. **Performance Optimization**: Monitor and optimize if needed
5. **Documentation**: Update user manual with new features

## ✅ Success Criteria

- ✅ Role selection triggers automatic location and permission population
- ✅ Permission matrix dynamically shows role-relevant modules and actions
- ✅ Permissions are pre-checked based on role defaults
- ✅ Users can customize permissions beyond role defaults
- ✅ Form submission includes proper role-based data structure
- ✅ Error handling works for all edge cases
- ✅ TypeScript compilation is error-free
- ✅ Performance is acceptable for expected load
