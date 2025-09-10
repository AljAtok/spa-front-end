import { useState, useCallback } from "react";
import { useApi } from "./useApi";
import { getErrorMessage } from "@/utils/errorUtils";

interface UseDataGridLoaderOptions<T> {
  endpoint: string;
  responseTransformer?: (data: T[]) => T[];
  defaultSort?: string;
}

export function useDataGridLoader<T extends { id: number | string }>({
  endpoint,
  responseTransformer,
}: //   defaultSort,
UseDataGridLoaderOptions<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ data: T[] }>(endpoint);
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        const transformedData = responseTransformer
          ? responseTransformer(response.data)
          : response.data;
        setRows(transformedData);
      } else {
        console.error("Invalid response format:", response);
        setError(
          `Failed to load data from ${endpoint}: Invalid response format`
        );
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        `Failed to load data from ${endpoint}`
      );
      console.error(`Error fetching data from ${endpoint}:`, error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, get, responseTransformer]);

  return {
    rows,
    loading,
    error,
    loadData,
    setRows,
  };
}
