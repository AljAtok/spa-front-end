// src/hooks/useSecurity.ts

import { useContext } from "react";
import SecurityContext from "../contexts/SecurityContext";

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

/**
 * Custom hook to access the Security context
 * @returns SecurityContextType
 * @throws Error if used outside of SecurityProvider
 */
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
};

export default useSecurity;
