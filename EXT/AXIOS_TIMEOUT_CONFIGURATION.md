# Axios Timeout Configuration Fix

## Problem Solved

Fixed "timeout of 10000ms exceeded" errors that were occurring for large data operations (POST/PATCH/GET/DELETE) by implementing dynamic timeout configuration.

## Solution Implemented

### 1. Dynamic Timeout Configuration

```typescript
const TIMEOUT_CONFIG = {
  DEFAULT: 30000, // 30 seconds for most operations
  LARGE_DATA: 120000, // 2 minutes for large data operations
  FILE_UPLOAD: 300000, // 5 minutes for file uploads
  REPORTS: 180000, // 3 minutes for report generation
  REFRESH_TOKEN: 15000, // 15 seconds for token refresh
};
```

### 2. Intelligent Timeout Detection

The system automatically detects request types and applies appropriate timeouts:

- **File uploads**: URLs containing 'upload' or 'file' → 5 minutes
- **Reports/Exports**: URLs containing 'report' or 'export' → 3 minutes
- **Token refresh**: URLs containing 'refresh-token' → 15 seconds
- **Large data operations**: POST/PATCH requests with payloads > 10KB → 2 minutes
- **Bulk operations**: URLs containing 'bulk' or 'batch' → 2 minutes
- **Default operations**: All other requests → 30 seconds

### 3. Debug Logging

Extended timeouts are logged for debugging:

```
⏱️ Extended timeout set for request: 120000ms for /api/users/bulk-update
```

## Usage Examples

### Automatic Timeout (Recommended)

```typescript
// The system automatically detects and applies appropriate timeout
const response = await api.post("/api/users/bulk-update", largeDataArray);
```

### Custom Timeout Instance

```typescript
import { createCustomTimeoutApi, AXIOS_TIMEOUTS } from "../api/axiosConfig";

// Create instance with 10-minute timeout for very large operations
const longTimeoutApi = createCustomTimeoutApi(10 * 60 * 1000);
const response = await longTimeoutApi.post(
  "/api/data/massive-import",
  hugeDataset
);
```

### Using Timeout Constants

```typescript
import { AXIOS_TIMEOUTS } from "../api/axiosConfig";

// Access timeout configurations in components
const isLongOperation = estimatedTime > AXIOS_TIMEOUTS.DEFAULT;
```

## Timeout Scenarios

| Operation Type            | Timeout  | Use Case                       |
| ------------------------- | -------- | ------------------------------ |
| **Login/Auth**            | 15s      | Authentication should be fast  |
| **Regular API calls**     | 30s      | Standard CRUD operations       |
| **Large data POST/PATCH** | 2m       | Bulk updates, complex data     |
| **File uploads**          | 5m       | Document/image uploads         |
| **Report generation**     | 3m       | Complex queries, data exports  |
| **Custom operations**     | Variable | Use `createCustomTimeoutApi()` |

## Testing the Fix

### Before Fix

```
Error: timeout of 10000ms exceeded
```

### After Fix

```
⏱️ Extended timeout set for request: 120000ms for /api/users/bulk-update
✅ Request completed successfully in 45 seconds
```

## Monitoring and Debugging

1. **Console Logs**: Watch for timeout extension messages
2. **Network Tab**: Verify requests complete within allocated time
3. **Error Handling**: Timeout errors now include more context

## Configuration Notes

- Default timeout increased from 10s to 30s for better reliability
- Token refresh kept shorter (15s) to fail fast if backend is down
- Large operation timeouts are generous but not infinite
- All timeouts can be customized via the `TIMEOUT_CONFIG` object

## Benefits

✅ **Eliminates premature timeouts** for large operations
✅ **Maintains fast failures** for authentication
✅ **Automatic detection** reduces manual configuration
✅ **Flexible custom timeouts** for special cases
✅ **Better debugging** with timeout logging
✅ **Backward compatible** with existing code
