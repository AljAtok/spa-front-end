// src/config/security.ts

/**
 * Comprehensive security configuration for the application
 */

export const SECURITY_CONFIG = {
  // Encryption settings
  ENCRYPTION: {
    KEY:
      import.meta.env.VITE_ENCRYPTION_KEY ||
      "dev-fallback-key-change-in-production-ss",
    ALGORITHM: "AES",
    MODE: "CBC",
    PADDING: "PKCS7",
  },

  // Token validation settings
  TOKENS: {
    MIN_ENTROPY_BITS: 128,
    MAX_AGE_HOURS: 24,
    REFRESH_THRESHOLD_MINUTES: 15,
    CSRF_TOKEN_LENGTH: 32,
  },

  // Session security
  SESSION: {
    FINGERPRINT_COMPONENTS: [
      "userAgent",
      "language",
      "timezone",
      "screenResolution",
      "colorDepth",
      "platform",
      "hardwareConcurrency",
    ],
    MAX_IDLE_MINUTES: 30,
    REQUIRE_FINGERPRINT_MATCH: true,
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", "data:", "https:"],
    FONT_SRC: ["'self'", "data:"],
    CONNECT_SRC: ["'self'", "http://localhost:*", "https://localhost:*"],
    FRAME_ANCESTORS: ["'none'"],
    FORM_ACTION: ["'self'"],
    BASE_URI: ["'self'"],
  },

  // HTTPS settings
  HTTPS: {
    ENFORCE_SECURE_COOKIES: true,
    HSTS_MAX_AGE: 31536000, // 1 year
    INCLUDE_SUBDOMAINS: true,
    PRELOAD: true,
  },

  // Input validation
  INPUT_VALIDATION: {
    MAX_EMAIL_LENGTH: 254,
    MAX_PASSWORD_LENGTH: 128,
    MAX_USERNAME_LENGTH: 50,
    ALLOWED_EMAIL_CHARS: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ALLOWED_USERNAME_CHARS: /^[a-zA-Z0-9_-]+$/,
    PASSWORD_MIN_LENGTH: 8,
  },

  // Rate limiting (client-side tracking)
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MINUTES: 15,
    },
    API_REQUESTS: {
      MAX_PER_MINUTE: 100,
      BURST_LIMIT: 20,
    },
  },

  // XSS Protection
  XSS: {
    SANITIZE_HTML: true,
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "span"],
    ALLOWED_ATTRIBUTES: ["class"],
    FORBIDDEN_PROTOCOLS: ["javascript:", "vbscript:", "data:"],
  },
  // Development/Production flags
  ENVIRONMENT: {
    IS_DEVELOPMENT: import.meta.env.MODE === "development",
    ENABLE_DEBUG_LOGGING: import.meta.env.VITE_DEBUG === "true",
    STRICT_TRANSPORT_SECURITY: import.meta.env.MODE === "production",
  },
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  "Content-Security-Policy": [
    `default-src ${SECURITY_CONFIG.CSP.DEFAULT_SRC.join(" ")}`,
    `script-src ${SECURITY_CONFIG.CSP.SCRIPT_SRC.join(" ")}`,
    `style-src ${SECURITY_CONFIG.CSP.STYLE_SRC.join(" ")}`,
    `img-src ${SECURITY_CONFIG.CSP.IMG_SRC.join(" ")}`,
    `font-src ${SECURITY_CONFIG.CSP.FONT_SRC.join(" ")}`,
    `connect-src ${SECURITY_CONFIG.CSP.CONNECT_SRC.join(" ")}`,
    `frame-ancestors ${SECURITY_CONFIG.CSP.FRAME_ANCESTORS.join(" ")}`,
    `form-action ${SECURITY_CONFIG.CSP.FORM_ACTION.join(" ")}`,
    `base-uri ${SECURITY_CONFIG.CSP.BASE_URI.join(" ")}`,
  ].join("; "),

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Prevent embedding in frames
  "X-Frame-Options": "DENY",

  // XSS Protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "accelerometer=()",
    "gyroscope=()",
  ].join(", "),

  // Strict Transport Security (HTTPS only)
  ...(SECURITY_CONFIG.ENVIRONMENT.STRICT_TRANSPORT_SECURITY && {
    "Strict-Transport-Security": `max-age=${SECURITY_CONFIG.HTTPS.HSTS_MAX_AGE}; includeSubDomains; preload`,
  }),

  // Cache Control for sensitive pages
  "Cache-Control": "no-cache, no-store, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Allowed origins for CORS and CSRF protection
 */
export const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost:3000",
  "https://localhost:5173",
  ...(SECURITY_CONFIG.ENVIRONMENT.IS_DEVELOPMENT
    ? [
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://127.0.0.1:3000",
        "https://127.0.0.1:5173",
      ]
    : []),
  // Add production origins here
  // 'https://your-production-domain.com'
];

/**
 * Security validation rules
 */
export const SECURITY_RULES = {
  validateEmail: (email: string): boolean => {
    return (
      SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_EMAIL_CHARS.test(email) &&
      email.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_EMAIL_LENGTH
    );
  },

  validateUsername: (username: string): boolean => {
    return (
      SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_USERNAME_CHARS.test(username) &&
      username.length <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_USERNAME_LENGTH
    );
  },

  validatePasswordStrength: (
    password: string
  ): {
    isValid: boolean;
    errors: string[];
    score: number;
  } => {
    const errors: string[] = [];
    let score = 0;

    if (
      password.length < SECURITY_CONFIG.INPUT_VALIDATION.PASSWORD_MIN_LENGTH
    ) {
      errors.push(
        `Password must be at least ${SECURITY_CONFIG.INPUT_VALIDATION.PASSWORD_MIN_LENGTH} characters long`
      );
    } else {
      score += 20;
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    } else {
      score += 20;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    } else {
      score += 20;
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    } else {
      score += 20;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    } else {
      score += 20;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  },
};

export default {
  SECURITY_CONFIG,
  SECURITY_HEADERS,
  ALLOWED_ORIGINS,
  SECURITY_RULES,
};
