# ACCESS KEY DROPDOWN - USER GUIDE 📚

## 🎯 **Overview**

The Access Key Dropdown feature allows users to change their default access key directly from the Topbar. This determines which permissions and data the user has access to within the application.

## 🖱️ **How to Use**

### **Step 1: Access the Dropdown**

1. Look for the **PersonOutlineIcon** (👤) in the top-right corner of the application
2. Click on the **PersonOutlineIcon** to open the dropdown menu

### **Step 2: Open Access Key Modal**

1. In the dropdown menu, click on **"Change Access Key"** option
2. This will open the Access Key Selection modal

### **Step 3: Select New Access Key**

1. In the modal, you'll see a dropdown with all your available access keys
2. The current access key will be indicated at the bottom
3. Select your desired access key from the dropdown
4. Click **"Change Access Key"** to confirm your selection

### **Step 4: Confirmation**

1. The system will process your request (loading indicator will show)
2. Upon success, the modal will close
3. Your permissions will be updated to reflect the new access key

## 🔍 **Visual Guide**

```
Topbar Layout:
[Search Bar] ................ [🌙] [🔔] [⚙️] [👤] [🚪]
                                              ↑
                                         Click here
```

**Dropdown Menu:**

```
┌─────────────────────────┐
│ 🔑 Change Access Key    │
└─────────────────────────┘
```

**Access Key Modal:**

```
┌─────────────────────────────────────┐
│ 🔑 Change Access Key                │
├─────────────────────────────────────┤
│                                     │
│ Select the access key you want to   │
│ use as your default...              │
│                                     │
│ Access Key: [▼ ACCESS KEY 1      ]  │
│                                     │
│ Current: ACCESS KEY 2               │
│                                     │
├─────────────────────────────────────┤
│              [Cancel] [🔑 Change]   │
└─────────────────────────────────────┘
```

## ⚙️ **Technical Details**

### **Data Source**

- Access keys are fetched from `UserPermissionsContext.fullUserData.access_keys`
- Only active access keys are shown (status_id: 1, user_access_key_status_id: 1)

### **Validation**

- Empty access key lists show a warning message
- Inactive access keys are filtered out automatically
- Current access key is clearly indicated

### **State Management**

- Modal state is managed locally in the Topbar component
- Loading states prevent multiple simultaneous changes
- Menu closes automatically when modal opens

## 🔧 **Developer Information**

### **Component Structure**

```
Topbar.tsx
├── PersonOutlineIcon (with onClick)
├── Menu (dropdown)
│   └── MenuItem ("Change Access Key")
└── AccessKeyModal
    ├── FormControl (access key selection)
    ├── Select (dropdown)
    └── Actions (Cancel/Confirm)
```

### **Key Props & State**

```typescript
// State
const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const [accessKeyModalOpen, setAccessKeyModalOpen] = useState(false);
const [changingAccessKey, setChangingAccessKey] = useState(false);

// Data
const accessKeys = typedUserData?.access_keys || [];
const currentAccessKeyId = currentUser?.default_access_key_id;
```

### **Event Flow**

1. `handlePersonMenuClick` - Opens dropdown menu
2. `handleChangeAccessKeyClick` - Opens modal, closes menu
3. `handleAccessKeyChange` - Processes access key change
4. `onClose` - Closes modal and resets state

## 🎨 **Styling & Theming**

### **Dark Mode Support**

- All components respect the current theme (dark/light)
- Colors automatically adjust based on theme
- Proper contrast maintained in all modes

### **Material-UI Integration**

- Uses Material-UI components for consistency
- Follows application's color palette
- Responsive design for mobile and desktop

### **Color Scheme**

```typescript
// Primary colors from theme
backgroundColor: colors.primary[400],    // Background
color: colors.grey[100],                 // Text
borderColor: colors.grey[700],           // Borders
hoverColor: colors.greenAccent[500],     // Hover states
```

## 🚨 **Error Handling**

### **No Access Keys Available**

- Shows warning alert: "No active access keys available for your account"
- Change button is disabled
- Clear messaging to user

### **API Errors**

- Loading state prevents multiple requests
- Error handling in try/catch blocks
- Graceful fallback behavior

### **Network Issues**

- Loading indicators show during API calls
- Timeout handling for long requests
- User feedback on failures

## 🔄 **Backend Integration**

### **Expected API Endpoint**

```
PATCH /api/users/{user_id}/default-access-key
Headers: {
  Authorization: Bearer {token}
  Content-Type: application/json
}
Body: {
  "access_key_id": number
}
```

### **Response Format**

```json
{
  "success": true,
  "message": "Default access key updated successfully",
  "data": {
    "user_id": 3,
    "default_access_key_id": 2
  }
}
```

### **Error Response**

```json
{
  "success": false,
  "message": "Invalid access key or insufficient permissions",
  "error_code": "INVALID_ACCESS_KEY"
}
```

## 📱 **Mobile Responsiveness**

### **Mobile Behavior**

- Modal is full-width on mobile devices
- Touch-friendly button sizes
- Proper spacing for mobile interaction
- Responsive typography

### **Tablet Behavior**

- Modal maintains max-width constraints
- Comfortable spacing and sizing
- Easy dropdown interaction

## ♿ **Accessibility**

### **Keyboard Navigation**

- Tab navigation through all interactive elements
- Enter/Space key activation
- Escape key closes modal

### **Screen Reader Support**

- Proper ARIA labels on interactive elements
- Descriptive text for modal content
- Clear hierarchy with proper headings

### **Visual Accessibility**

- High contrast ratios maintained
- Clear visual indicators for states
- Sufficient touch target sizes

## 🧪 **Testing Considerations**

### **Test Scenarios**

1. **Happy Path**: User selects different access key successfully
2. **No Access Keys**: User with empty access keys array
3. **Single Access Key**: User with only one access key
4. **Network Error**: API call fails during change
5. **Loading State**: Multiple rapid clicks handled properly

### **Edge Cases**

- User closes modal during loading
- Access key data changes while modal is open
- Network connectivity issues
- Invalid access key selections

## 🔮 **Future Enhancements**

### **Potential Improvements**

1. **Access Key Descriptions**: Show descriptions for each access key
2. **Permission Preview**: Show what permissions each key provides
3. **Usage Statistics**: Show last used date for each access key
4. **Favorites**: Mark frequently used access keys
5. **Search/Filter**: Search through many access keys

### **Integration Opportunities**

1. **Notification System**: Toast notifications for changes
2. **Audit Logging**: Track access key changes
3. **Permission Comparison**: Compare permissions between keys
4. **Role-Based Filtering**: Filter keys by user role

## 📋 **Troubleshooting**

### **Common Issues**

**Issue**: Modal doesn't open when clicking "Change Access Key"
**Solution**: Check browser console for JavaScript errors, verify AccessKeyModal component import

**Issue**: No access keys showing in dropdown
**Solution**: Verify UserPermissionsContext is providing access_keys data, check filtering logic

**Issue**: Change button remains loading
**Solution**: Check API endpoint availability, verify error handling in handleAccessKeyChange

**Issue**: Modal styling looks incorrect
**Solution**: Verify Material-UI theme is properly loaded, check color token imports

### **Debug Steps**

1. Open browser developer tools
2. Check console for errors
3. Verify network requests in Network tab
4. Inspect UserPermissionsContext data
5. Test with different access key configurations

## ✅ **Success Indicators**

The access key dropdown is working correctly when:

- ✅ PersonOutlineIcon opens dropdown menu
- ✅ "Change Access Key" option appears with key icon
- ✅ Modal opens with proper styling and theme
- ✅ Access keys populate in dropdown selection
- ✅ Current access key is indicated correctly
- ✅ Change operation shows loading state
- ✅ Modal closes after successful change
- ✅ Error states are handled gracefully

## 📞 **Support**

For technical support or feature requests related to the Access Key Dropdown:

1. Check this documentation first
2. Review browser console for errors
3. Test with different user accounts/access keys
4. Check UserPermissionsContext data structure
5. Verify API endpoint functionality

The Access Key Dropdown feature is now **fully functional and ready for production use**! 🚀
