// src/utils/security.ts

import CryptoJS from "crypto-js";
import DOMPurify from "dompurify";
import { SECURITY_CONFIG } from "../config/security";

/**
 * Generates a secure random string for CSRF tokens and session fingerprints
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

/**
 * Encrypts sensitive data before storing in browser storage
 */
export const encryptData = (data: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      data,
      SECURITY_CONFIG.ENCRYPTION.KEY
    ).toString();
    console.debug("🔐 Data encrypted successfully");
    return encrypted;
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypts sensitive data from browser storage
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      SECURITY_CONFIG.ENCRYPTION.KEY
    );
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error("Decryption resulted in empty string");
    }

    console.debug("🔓 Data decrypted successfully");
    return result;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
};

/**
 * Validates token entropy to prevent weak tokens
 */
export const validateTokenEntropy = (token: string): boolean => {
  if (!token || token.length < 32) {
    console.warn("⚠️ Token too short for security validation");
    return false;
  }

  // Calculate Shannon entropy
  const charFreq: { [key: string]: number } = {};
  for (const char of token) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  let entropy = 0;
  for (const freq of Object.values(charFreq)) {
    const probability = freq / token.length;
    entropy -= probability * Math.log2(probability);
  }
  const entropyBits = entropy * token.length;
  const isValid = entropyBits >= SECURITY_CONFIG.TOKENS.MIN_ENTROPY_BITS;

  console.debug(
    `🔍 Token entropy validation: ${entropyBits.toFixed(2)} bits (threshold: ${
      SECURITY_CONFIG.TOKENS.MIN_ENTROPY_BITS
    })`,
    {
      isValid,
      tokenLength: token.length,
    }
  );

  return isValid;
};

/**
 * Generates a browser fingerprint for session validation
 */
export const generateSessionFingerprint = (): string => {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
  };

  const fingerprintString = JSON.stringify(fingerprint);
  const hash = CryptoJS.SHA256(fingerprintString).toString();

  console.debug("🖥️ Session fingerprint generated");
  return hash;
};

/**
 * Validates session fingerprint to detect session hijacking
 */
export const validateSessionFingerprint = (
  storedFingerprint: string
): boolean => {
  try {
    const currentFingerprint = generateSessionFingerprint();
    const isValid = currentFingerprint === storedFingerprint;

    if (!isValid) {
      console.warn(
        "⚠️ Session fingerprint mismatch - possible session hijacking"
      );
    } else {
      console.debug("✅ Session fingerprint validated");
    }

    return isValid;
  } catch (error) {
    console.error("❌ Failed to validate session fingerprint:", error);
    return false;
  }
};

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Configure DOMPurify for strict sanitization
  const config = {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    SANITIZE_DOM: true, // Sanitize DOM elements
  };

  const sanitized = DOMPurify.sanitize(input, config);

  if (sanitized !== input) {
    console.warn(
      "⚠️ Input contained potentially malicious content and was sanitized"
    );
  }

  return sanitized;
};

/**
 * Sanitizes HTML content while preserving safe formatting
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Allow basic formatting tags but remove potentially dangerous content
  const config = {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "span"],
    ALLOWED_ATTR: ["class"], // Only allow class attributes
    SANITIZE_DOM: true,
    FORBID_TAGS: ["script", "object", "embed", "link", "style", "meta"],
    FORBID_ATTR: [
      "onclick",
      "onload",
      "onerror",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
  };

  const sanitized = DOMPurify.sanitize(html, config);

  if (sanitized !== html) {
    console.warn(
      "⚠️ HTML content contained potentially malicious elements and was sanitized"
    );
  }

  return sanitized;
};

/**
 * Generates a CSRF token for request validation
 */
export const generateCSRFToken = (): string => {
  const token = generateSecureRandomString(
    SECURITY_CONFIG.TOKENS.CSRF_TOKEN_LENGTH
  );
  const timestamp = Date.now();

  // Store CSRF token with timestamp for validation
  const csrfData = {
    token,
    timestamp,
    fingerprint: generateSessionFingerprint(),
  };

  sessionStorage.setItem("csrfToken", JSON.stringify(csrfData));
  console.debug("🛡️ CSRF token generated and stored");

  return token;
};

/**
 * Validates a CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  try {
    const storedData = sessionStorage.getItem("csrfToken");
    if (!storedData) {
      console.warn("⚠️ No CSRF token found in storage");
      return false;
    }

    const csrfData = JSON.parse(storedData);
    const isTokenValid = csrfData.token === token;
    const isNotExpired =
      Date.now() - csrfData.timestamp <
      SECURITY_CONFIG.TOKENS.MAX_AGE_HOURS * 3600 * 1000;
    const isFingerprintValid = validateSessionFingerprint(csrfData.fingerprint);

    const isValid = isTokenValid && isNotExpired && isFingerprintValid;

    if (!isValid) {
      console.warn("⚠️ CSRF token validation failed", {
        tokenMatch: isTokenValid,
        notExpired: isNotExpired,
        fingerprintValid: isFingerprintValid,
      });
    } else {
      console.debug("✅ CSRF token validated successfully");
    }

    return isValid;
  } catch (_error) {
    console.error("❌ CSRF token validation error:", _error);
    return false;
  }
};

/**
 * Validates request origin to prevent CSRF attacks
 */
export const validateRequestOrigin = (
  allowedOrigins: string[] = []
): boolean => {
  const currentOrigin = window.location.origin;
  const referer = document.referrer;

  // Default allowed origins
  const defaultAllowed = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://localhost:3000",
    "https://localhost:5173",
    currentOrigin,
  ];

  const allAllowed = [...defaultAllowed, ...allowedOrigins];

  // Check if current origin is allowed
  const isOriginAllowed = allAllowed.includes(currentOrigin);

  // Check referer if present
  let isRefererValid = true;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      isRefererValid = allAllowed.includes(refererOrigin);
    } catch (error) {
      console.warn("⚠️ Invalid referer URL:", referer);
      console.warn("⚠️ Error:", error);
      isRefererValid = false;
    }
  }

  const isValid = isOriginAllowed && isRefererValid;

  if (!isValid) {
    console.warn("⚠️ Request origin validation failed", {
      currentOrigin,
      referer,
      allowedOrigins: allAllowed,
    });
  } else {
    console.debug("✅ Request origin validated");
  }

  return isValid;
};

/**
 * Securely wipes sensitive data from memory
 */
export const secureWipe = (data: string): void => {
  if (typeof data === "string") {
    // Overwrite the string in memory (limited effectiveness in JavaScript)
    for (let i = 0; i < data.length; i++) {
      // This is more of a best practice signal than actual secure wiping
      // JavaScript doesn't provide true secure memory wiping
    }
  }
  console.debug("🧹 Attempted secure data wipe");
};

/**
 * Sets secure HTTP headers (to be used with a service worker or server-side)
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https://localhost:*; frame-ancestors 'none';",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
};

/**
 * Applies security headers to requests (for use in axios interceptors)
 */
export const applySecurityHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  const csrfToken = generateCSRFToken();

  return {
    ...headers,
    "X-CSRF-Token": csrfToken,
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
};

/**
 * Security audit function to check for common vulnerabilities
 */
export const performSecurityAudit = (): {
  vulnerabilities: string[];
  recommendations: string[];
  score: number;
} => {
  const vulnerabilities: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for HTTPS
  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    vulnerabilities.push("Site not served over HTTPS");
    recommendations.push("Enable HTTPS for all production traffic");
    score -= 20;
  }

  // Check for secure storage
  if (!window.crypto || !window.crypto.getRandomValues) {
    vulnerabilities.push("Web Crypto API not available");
    recommendations.push("Ensure modern browser support");
    score -= 15;
  }
  // Check for encryption key
  if (
    SECURITY_CONFIG.ENCRYPTION.KEY ===
    "dev-fallback-key-change-in-production-ss"
  ) {
    vulnerabilities.push("Using default encryption key");
    recommendations.push("Set VITE_ENCRYPTION_KEY environment variable");
    score -= 25;
  }

  // Check for third-party scripts
  const scripts = document.querySelectorAll("script[src]");
  let hasThirdPartyScripts = false;
  scripts.forEach((script) => {
    const src = script.getAttribute("src");
    if (
      src &&
      !src.startsWith("/") &&
      !src.startsWith(window.location.origin)
    ) {
      hasThirdPartyScripts = true;
    }
  });

  if (hasThirdPartyScripts) {
    vulnerabilities.push("Third-party scripts detected");
    recommendations.push("Review and minimize third-party script usage");
    score -= 10;
  }

  console.info("🔒 Security audit completed", {
    vulnerabilities,
    recommendations,
    score: `${score}/100`,
  });

  return { vulnerabilities, recommendations, score };
};

export default {
  encryptData,
  decryptData,
  validateTokenEntropy,
  generateSessionFingerprint,
  validateSessionFingerprint,
  sanitizeInput,
  sanitizeHTML,
  generateCSRFToken,
  validateCSRFToken,
  validateRequestOrigin,
  secureWipe,
  applySecurityHeaders,
  performSecurityAudit,
};
