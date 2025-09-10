# CORS Multiple Frontend Configuration Guide

## Problem Summary

**Error**: `Access-Control-Allow-Origin` header contains multiple values but only one is allowed.

**Root Cause**: Backend is incorrectly setting CORS header as:

```
Access-Control-Allow-Origin: http://localhost:5173,http://localhost:3000
```

**Solution**: Configure dynamic origin validation instead of multiple static origins.

## Backend Configuration Solutions

### 1. Express.js with Dynamic CORS (Recommended)

```javascript
// backend/server.js or app.js
const express = require("express");
const cors = require("cors");
const app = express();

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000", // React dev server
  "http://localhost:5173", // Vite dev server
  "http://localhost:5174", // Alternative Vite port
  "http://localhost:8080", // Vue dev server
  "http://localhost:4200", // Angular dev server
  "https://yourdomain.com", // Production frontend 1
  "https://app.yourdomain.com", // Production frontend 2
  "https://admin.yourdomain.com", // Admin frontend
];

// Dynamic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS Origin Request:", origin);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log("No origin - allowing request");
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log("Origin allowed:", origin);
      callback(null, true);
    } else {
      console.log("Origin blocked:", origin);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["X-CSRF-Token"], // Headers the frontend can access
  maxAge: 86400, // Cache preflight response for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));
```

### 2. Environment-Based Configuration

```javascript
// backend/config/cors.js
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:4200",
];

const productionOrigins = [
  "https://yourdomain.com",
  "https://app.yourdomain.com",
  "https://admin.yourdomain.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    let allowedOrigins = [];

    if (isDevelopment) {
      allowedOrigins = [...developmentOrigins, ...productionOrigins];
    } else if (isProduction) {
      allowedOrigins = productionOrigins;
    }

    // Allow requests with no origin in development
    if (!origin && isDevelopment) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
    "Cache-Control",
    "Pragma",
  ],
};

module.exports = corsOptions;
```

### 3. Regex Pattern Matching for Subdomains

```javascript
// backend/config/cors.js
const corsOptions = {
  origin: function (origin, callback) {
    // Patterns for different environments
    const patterns = [
      /^http:\/\/localhost:\d+$/, // Any localhost port
      /^https:\/\/.*\.yourdomain\.com$/, // Any subdomain
      /^https:\/\/yourdomain\.com$/, // Main domain
    ];

    // Allow no origin in development
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin matches any pattern
    const isAllowed = patterns.some((pattern) => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
    "Cache-Control",
    "Pragma",
  ],
};

module.exports = corsOptions;
```

### 4. For Non-Express Backends

#### Node.js HTTP Server

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://yourdomain.com",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Your API logic here
});
```

#### FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://yourdomain.com",
    "https://app.yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

## Frontend Updates

### Updated Axios Configuration

The frontend axios config has been updated with:

- ✅ `withCredentials: true` - Enables sending cookies/auth headers
- ✅ `timeout: 10000` - 10 second timeout
- ✅ Proper security headers

## Testing CORS Configuration

### 1. Test Different Origins

```bash
# Test from different origins
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/auth/login

curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/auth/login
```

### 2. Browser DevTools Check

After implementing the backend changes, check in browser DevTools:

1. Network tab → Look for preflight OPTIONS requests
2. Response headers should show single `Access-Control-Allow-Origin` value
3. No CORS errors in console

## Deployment Considerations

### Production Environment

```javascript
// backend/config/production-cors.js
const productionCorsOptions = {
  origin: [
    "https://yourmainapp.com",
    "https://app.yourmainapp.com",
    "https://admin.yourmainapp.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};
```

### Docker/Kubernetes

When deploying with containers, ensure environment variables are properly set:

```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Quick Fix for Immediate Resolution

If you need an immediate fix while implementing the above:

### Temporary Backend Fix (Development Only)

```javascript
// TEMPORARY - NOT FOR PRODUCTION
app.use(
  cors({
    origin: true, // Accepts any origin
    credentials: true,
  })
);
```

**⚠️ Warning**: This is insecure and should only be used temporarily in development.

## Implementation Steps

1. **Update your backend** with dynamic CORS configuration
2. **Test with multiple frontend origins**
3. **Update frontend** axios config (already done)
4. **Deploy and verify** in production environment

The key is to validate origins dynamically rather than setting multiple static values in the header.
