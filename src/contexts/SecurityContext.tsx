// src/contexts/SecurityContext.tsx

import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { performSecurityAudit } from "../utils/security";
import { SECURITY_CONFIG } from "../config/security";

interface SecurityContextType {
  securityAudit: {
    vulnerabilities: string[];
    recommendations: string[];
    score: number;
  };
  isSecureConnection: boolean;
  sessionFingerprint: string | null;
  lastSecurityCheck: Date | null;
  performSecurityCheck: () => void;
  securityAlerts: SecurityAlert[];
  dismissAlert: (id: string) => void;
}

interface SecurityAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
}) => {
  const [securityAudit, setSecurityAudit] = useState({
    vulnerabilities: [] as string[],
    recommendations: [] as string[],
    score: 100,
  });
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [sessionFingerprint, setSessionFingerprint] = useState<string | null>(
    null
  );
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  // Generate unique alert ID
  const generateAlertId = (): string => {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Dismiss security alert
  const dismissAlert = useCallback((id: string) => {
    setSecurityAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, dismissed: true } : alert
      )
    );
  }, []);

  // Add security alert
  const addSecurityAlert = useCallback(
    (type: SecurityAlert["type"], message: string) => {
      const alert: SecurityAlert = {
        id: generateAlertId(),
        type,
        message,
        timestamp: new Date(),
        dismissed: false,
      };

      setSecurityAlerts((prev) => [...prev, alert]);

      // Auto-dismiss info alerts after 10 seconds
      if (type === "info") {
        setTimeout(() => {
          dismissAlert(alert.id);
        }, 10000);
      }
    },
    [dismissAlert]
  );

  // Perform comprehensive security check
  const performSecurityCheck = useCallback(() => {
    console.debug("🔒 Performing security check...");

    try {
      // Run security audit
      const audit = performSecurityAudit();
      setSecurityAudit(audit);
      setLastSecurityCheck(new Date());

      // Check connection security
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      setIsSecureConnection(isSecure);

      // Generate session fingerprint
      if (typeof window.crypto?.getRandomValues === "function") {
        const fingerprint = btoa(
          JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: Date.now(),
          })
        );
        setSessionFingerprint(fingerprint);
      }

      // Alert for security issues
      if (audit.vulnerabilities.length > 0) {
        addSecurityAlert(
          "warning",
          `${audit.vulnerabilities.length} security vulnerabilities detected`
        );
      }

      if (audit.score < 80) {
        addSecurityAlert("error", `Security score is low: ${audit.score}/100`);
      }

      if (!isSecure && window.location.hostname !== "localhost") {
        addSecurityAlert(
          "error",
          "Insecure connection detected - use HTTPS in production"
        );
      } // Check for encryption key
      if (
        SECURITY_CONFIG.ENCRYPTION.KEY ===
        "dev-fallback-key-change-in-production-ss"
      ) {
        addSecurityAlert(
          "warning",
          "Using default encryption key - set VITE_ENCRYPTION_KEY"
        );
      }

      console.debug(`✅ Security check completed - Score: ${audit.score}/100`);
    } catch (error) {
      console.error("❌ Security check failed:", error);
      addSecurityAlert("error", "Security check failed");
    }
  }, [addSecurityAlert]);

  // Run security check on mount and periodically
  useEffect(() => {
    performSecurityCheck();

    // Run security check every 5 minutes
    const interval = setInterval(performSecurityCheck, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [performSecurityCheck]);

  // Monitor for security events
  useEffect(() => {
    const handleSecurityEvent = (event: Event) => {
      console.warn("🚨 Security event detected:", event.type);
      addSecurityAlert("warning", `Security event: ${event.type}`);
    };

    // Listen for potential security events
    window.addEventListener("beforeunload", handleSecurityEvent);
    window.addEventListener("focus", performSecurityCheck);

    // Check for development tools (basic detection)
    const devToolsCheck = () => {
      if (
        window.outerHeight - window.innerHeight > 200 ||
        window.outerWidth - window.innerWidth > 200
      ) {
        console.warn("🔍 Developer tools may be open");
        if (SECURITY_CONFIG.ENVIRONMENT.IS_DEVELOPMENT) {
          addSecurityAlert(
            "info",
            "Developer tools detected (development mode)"
          );
        } else {
          addSecurityAlert("warning", "Developer tools detected");
        }
      }
    };

    const devToolsInterval = setInterval(devToolsCheck, 10000);

    return () => {
      window.removeEventListener("beforeunload", handleSecurityEvent);
      window.removeEventListener("focus", performSecurityCheck);
      clearInterval(devToolsInterval);
    };
  }, [addSecurityAlert, performSecurityCheck]);

  const value: SecurityContextType = {
    securityAudit,
    isSecureConnection,
    sessionFingerprint,
    lastSecurityCheck,
    performSecurityCheck,
    securityAlerts: securityAlerts.filter((alert) => !alert.dismissed),
    dismissAlert,
  };
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityContext;
