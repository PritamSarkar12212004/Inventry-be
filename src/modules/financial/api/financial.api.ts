import { apiDelete, apiGet, apiPatch, apiPost } from '../../../core/api';
import type {
  CreateExpenseCategoryPayload,
  CreateExpensePayload,
  CustomerOutstandingResponse,
  ExpenseCategoryItem,
  ExpenseCategoryListResponse,
  ExpenseItem,
  ExpenseListResponse,
  ExpenseTitleListResponse,
  FinancialOverviewData,
  FinancialTransactionsResponse,
  PurchaseExpenseSummaryResponse,
} from '../types';

export const financialApi = {
  getOverview: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<{ success: boolean; data: FinancialOverviewData }>(
      '/financial/overview',
      params,
    ),

  getTransactions: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiGet<{ success: boolean; data: FinancialTransactionsResponse }>(
      '/financial/transactions',
      params,
    ),

  getCustomerOutstanding: (
    search?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    apiGet<{ success: boolean; data: CustomerOutstandingResponse }>(
      '/financial/customer-outstanding',
      search || startDate || endDate
        ? {
            ...(search ? { search } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
          }
        : undefined,
    ),

  getPurchaseExpenseSummary: (
    search?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    apiGet<{ success: boolean; data: PurchaseExpenseSummaryResponse }>(
      '/financial/purchase-expense-summary',
      search || startDate || endDate
        ? {
            ...(search ? { search } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
          }
        : undefined,
    ),

  getExpenses: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    workType?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    productId?: string;
  }) =>
    apiGet<{ success: boolean; data: ExpenseListResponse }>(
      '/expenses',
      params,
    ),

  getExpenseTitles: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    workType?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiGet<{ success: boolean; data: ExpenseTitleListResponse }>(
      '/expenses/titles',
      params,
    ),

  createExpense: (payload: CreateExpensePayload) =>
    apiPost<{ success: boolean; data: ExpenseItem }, CreateExpensePayload>(
      '/expenses',
      payload,
    ),

  updateExpense: (id: string, payload: Partial<CreateExpensePayload>) =>
    apiPatch<
      { success: boolean; data: ExpenseItem },
      Partial<CreateExpensePayload>
    >(`/expenses/${id}`, payload),

  deleteExpense: (id: string) =>
    apiDelete<{ success: boolean; message?: string }>(
      `/expenses/${id}`,
    ),

  getExpenseCategories: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiGet<{ success: boolean; data: ExpenseCategoryListResponse }>(
      '/expenses/categories',
      params,
    ),

  createExpenseCategory: (payload: CreateExpenseCategoryPayload) =>
    apiPost<
      { success: boolean; data: ExpenseCategoryItem },
      CreateExpenseCategoryPayload
    >('/expenses/categories', payload),

  deleteExpenseCategory: (id: string) =>
    apiDelete<{ success: boolean; message?: string }>(
      `/expenses/categories/${id}`,
    ),
};
