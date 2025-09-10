# Testing Guide for Location Forms Edit Mode Fixes

## Prerequisites

1. Ensure the development server is running: `npm run dev`
2. Have some existing location types and locations in the database for testing edit mode

## Test Scenarios

### 1. LocationTypeForm Testing

#### Create Mode Testing

1. **Navigation**: Go to Location Types management page
2. **Click**: "Add Location Type" button
3. **Expected**:
   - Form loads immediately with empty fields
   - "Location Type Name" field is empty
   - Status radio buttons default to "Active"
   - Form title shows "Add Location Type"

#### Edit Mode Testing

1. **Navigation**: Go to Location Types management page
2. **Click**: Edit button for an existing location type
3. **Expected**:
   - Loading spinner appears briefly
   - Form loads with populated fields:
     - "Location Type Name" shows existing name
     - Status radio buttons show current status (Active/Inactive)
   - Form title shows "Edit Location Type"
   - All fields are editable

#### Form Validation Testing

1. **Test required fields**: Leave "Location Type Name" empty and try to proceed
2. **Test field length**: Enter very short (< 2 chars) or very long (> 50 chars) names
3. **Expected**: Validation messages appear and prevent form submission

#### Status Radio Button Testing

1. **Test switching**: Click between Active/Inactive options
2. **Test review step**: Status should display as readable labels ("Active"/"Inactive")
3. **Test submission**: Verify status is saved correctly

### 2. LocationForm Testing

#### Create Mode Testing

1. **Navigation**: Go to Locations management page
2. **Click**: "Add Location" button
3. **Expected**:
   - Form loads immediately with empty fields
   - "Location Name" field is empty
   - "Location Type" dropdown is empty (shows "Please select...")
   - Status radio buttons default to "Active"
   - Form title shows "Add Location"

#### Edit Mode Testing

1. **Navigation**: Go to Locations management page
2. **Click**: Edit button for an existing location
3. **Expected**:
   - Loading spinner appears briefly
   - Form loads with populated fields:
     - "Location Name" shows existing name
     - "Location Type" dropdown shows selected type
     - Status radio buttons show current status
   - Form title shows "Edit Location"
   - All fields are editable

#### Location Type Dropdown Testing

1. **Test options**: Dropdown should show only active location types
2. **Test selection**: Should be able to select different location types
3. **Test review step**: Selected location type name should display correctly

### 3. Multi-Step Navigation Testing

#### Step Navigation

1. **Test Next button**: Should validate current step before proceeding
2. **Test Back button**: Should return to previous step without validation
3. **Test validation**: Should prevent advancement if required fields are missing
4. **Test review step**: Should display all entered values correctly

#### Form Submission Testing

1. **Test create submission**: Should create new record and redirect to list
2. **Test edit submission**: Should update existing record and redirect to list
3. **Test error handling**: Should display errors if submission fails

### 4. Data Loading and Synchronization Testing

#### Edit Mode Data Loading

1. **Test initial load**: Form should not render until data is loaded
2. **Test multiple edits**: Switching between different edit items should load correct data
3. **Test error handling**: Should handle API errors gracefully

#### Form Reinitialization

1. **Test switching modes**: Go from create to edit (or vice versa) - form should reset properly
2. **Test different records**: Edit different records in sequence - each should load correct data

## Debugging Tools

### Console Logging

The forms now include extensive console logging. Open browser DevTools to see:

- Data loading progress
- Initial values being set
- Step progression
- Validation errors

### Key Debug Messages to Look For

```
LocationTypeForm:
- "loadLocationType called, locationTypeId: [id]"
- "Fetching location type data..."
- "Location type data: [data]"
- "Setting initial values: [values]"

LocationForm:
- Similar patterns for location data loading
```

## Common Issues and Solutions

### Issue: Form fields still blank in edit mode

**Check**:

1. Console for API errors
2. Network tab for failed requests
3. Console for "Setting initial values" messages

### Issue: Status radio buttons not working

**Check**:

1. Initial values in console
2. Form validation errors
3. Radio button value types (should be 1 or 2)

### Issue: Form not submitting

**Check**:

1. Validation errors in console
2. Network tab for API submission errors
3. Required field validation

## Success Criteria

✅ **Create Mode**: All fields empty, form loads immediately
✅ **Edit Mode**: All fields populated, form loads after data fetch
✅ **Status Radio Buttons**: Work in both modes, show correct labels
✅ **Validation**: Prevents submission with invalid data
✅ **Submission**: Successfully creates/updates records
✅ **Navigation**: Smooth step progression and form navigation
✅ **Type Safety**: No TypeScript compilation errors

## Performance Considerations

- Edit mode includes a brief loading state - this is expected and ensures data integrity
- Form re-renders when switching between create/edit modes - this is intentional for proper state management
- Loading spinner should appear only briefly unless there are network issues
