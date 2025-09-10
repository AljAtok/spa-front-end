// src/hooks/useLogoutSetup.ts
import { useEffect } from "react";
import { useApi } from "./useApi";
import { setLogoutPostFn } from "../api/axiosConfig";

/**
 * Hook to set up logout functionality for axios interceptors
 * This should be called in components that use authentication
 */
export const useLogoutSetup = () => {
  const { post } = useApi();

  useEffect(() => {
    // Set the logout post function for axiosConfig to use in interceptors
    setLogoutPostFn(post);
  }, [post]);
};
