// src/utils/passwordStrength.ts
import { PasswordStrengthMetrics } from "../types/ProfileTypes";

export const calculatePasswordStrength = (
  password: string
): PasswordStrengthMetrics => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const feedback: string[] = [];
  let score = 0;

  if (!hasMinLength) {
    feedback.push("Password must be at least 8 characters long");
  } else {
    score += 1;
  }

  if (!hasUppercase) {
    feedback.push("Add at least one uppercase letter");
  } else {
    score += 1;
  }

  if (!hasLowercase) {
    feedback.push("Add at least one lowercase letter");
  } else {
    score += 1;
  }

  if (!hasNumber) {
    feedback.push("Add at least one number");
  } else {
    score += 1;
  }

  if (!hasSymbol) {
    feedback.push("Add at least one special character");
  } else {
    score += 1;
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score = Math.min(score + 1, 5);
  }

  return {
    score: Math.min(score, 4),
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    feedback,
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Fair";
    case 4:
      return "Strong";
    default:
      return "Very Weak";
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "#f44336"; // Red
    case 2:
      return "#ff9800"; // Orange
    case 3:
      return "#ffeb3b"; // Yellow
    case 4:
      return "#4caf50"; // Green
    default:
      return "#f44336"; // Red
  }
};
