// src/utils/errorUtils.ts

interface ErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
  data?: {
    message?: string;
  };
  message?: string;
}

export const getErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  if (!error || typeof error !== "object") {
    return defaultMessage;
  }

  const err = error as ErrorLike;

  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.data?.message) {
    return err.data.message;
  }

  if (typeof err.message === "string") {
    return err.message;
  }

  return defaultMessage;
};
