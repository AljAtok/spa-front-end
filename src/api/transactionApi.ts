import {
  Transaction,
  TransactionFormValues,
  TransactionDetail,
  CreateTransactionResponse,
  TransactionDetailResponse,
  BatchUpdateRequest,
  BatchUpdateResponse,
} from "@/types/TransactionTypes";
import { AxiosRequestConfig } from "axios";

const API_BASE = "/transactions";

interface ApiMethods {
  get: <T = unknown>(
    url: string,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  post: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  patch: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  put: <T = unknown, D = unknown>(
    url: string,
    data: D,
    defaultSuccessMessage?: string,
    config?: AxiosRequestConfig
  ) => Promise<T>;
}

// Fetch all transactions
export const fetchTransactions = async ({
  get,
}: Pick<ApiMethods, "get">): Promise<Transaction[]> => {
  const response = await get<Transaction[]>(`${API_BASE}/headers`);

  // Transform the response to match the grid structure
  if (Array.isArray(response)) {
    return response.map((item) => ({
      ...item,
      trans_id: item.header.id,
      trans_number: item.header.trans_number,
      location_name: item.header.location_name,
      trans_date: item.header.trans_date,
      status_name: item.header.status_name || "Unknown",
      status_id: item.header.status_id,
      entries: item.details.length,
      total_sales: item.details.reduce(
        (sum: number, detail: TransactionDetail) =>
          sum + parseFloat(detail.sales_qty),
        0
      ),
      created_at: item.header.created_at,
      created_user: item.header.created_user,
    }));
  }

  return [];
};

// Fetch transaction header by ID for editing
export const fetchTransactionHeaderById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<TransactionDetailResponse | null> => {
  try {
    const response = await get<TransactionDetailResponse>(
      `${API_BASE}/headers/${id}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching transaction header:", error);
    return null;
  }
};

// Create merged transactions
export const createMergedTransactions = async (
  { post }: Pick<ApiMethods, "post">,
  transactionData: TransactionFormValues
): Promise<CreateTransactionResponse[]> => {
  const response = await post<CreateTransactionResponse[]>(
    `${API_BASE}/create-merged-transaction`,
    transactionData
  );
  return response;
};

// Update transaction detail
export const updateTransactionDetail = async (
  { put }: Pick<ApiMethods, "put">,
  detailId: string,
  detailData: Partial<TransactionDetail>
): Promise<TransactionDetail> => {
  const response = await put<TransactionDetail>(
    `${API_BASE}/details/${detailId}`,
    detailData
  );
  return response;
};

// Fetch transaction by ID
export const fetchTransactionById = async (
  { get }: Pick<ApiMethods, "get">,
  id: string
): Promise<Transaction | null> => {
  try {
    const response = await get<Transaction>(`${API_BASE}/${id}`);
    return response;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
};

// Create new transaction
export const createTransaction = async (
  { post }: Pick<ApiMethods, "post">,
  transactionData: TransactionFormValues
): Promise<Transaction> => {
  const response = await post<Transaction>(API_BASE, transactionData);
  return response;
};

// Update transaction
export const updateTransaction = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  transactionData: TransactionFormValues
): Promise<Transaction> => {
  const response = await patch<Transaction>(
    `${API_BASE}/${id}`,
    transactionData
  );
  return response;
};

// Post transaction (Lock)
export const postTransaction = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string
): Promise<Transaction> => {
  const response = await patch<Transaction>(
    `${API_BASE}/headers/${id}/post`,
    {}
  );
  return response;
};

// Cancel transaction
export const cancelTransaction = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  cancel_reason?: string
): Promise<Transaction> => {
  const response = await patch<Transaction>(
    `${API_BASE}/headers/${id}/cancel`,
    { cancel_reason }
  );
  return response;
};

// Revert transaction
export const revertTransaction = async (
  { patch }: Pick<ApiMethods, "patch">,
  id: string,
  undo_reason?: string
): Promise<Transaction> => {
  const response = await patch<Transaction>(
    `${API_BASE}/headers/${id}/revert`,
    { undo_reason }
  );
  return response;
};

// Batch update transactions
export const batchUpdateTransactions = async (
  { post }: Pick<ApiMethods, "post">,
  updateData: BatchUpdateRequest
): Promise<BatchUpdateResponse> => {
  const response = await post<BatchUpdateResponse>(
    `${API_BASE}/batch-update`,
    updateData
  );
  return response;
};
