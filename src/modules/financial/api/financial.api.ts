import { apiDelete, apiGet, apiPost } from '../../../core/api';
import type {
  CreateExpensePayload,
  CustomerOutstandingResponse,
  ExpenseItem,
  ExpenseListResponse,
  FinancialOverviewData,
  PurchaseExpenseSummaryResponse,
} from '../types';

export const financialApi = {
  getOverview: () =>
    apiGet<{ success: boolean; data: FinancialOverviewData }>(
      '/financial/overview',
    ),

  getCustomerOutstanding: (search?: string) =>
    apiGet<{ success: boolean; data: CustomerOutstandingResponse }>(
      '/financial/customer-outstanding',
      search ? { search } : undefined,
    ),

  getPurchaseExpenseSummary: (search?: string) =>
    apiGet<{ success: boolean; data: PurchaseExpenseSummaryResponse }>(
      '/financial/purchase-expense-summary',
      search ? { search } : undefined,
    ),

  getExpenses: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<{ success: boolean; data: ExpenseListResponse }>(
      '/financial/expenses',
      params,
    ),

  createExpense: (payload: CreateExpensePayload) =>
    apiPost<{ success: boolean; data: ExpenseItem }, CreateExpensePayload>(
      '/financial/expenses',
      payload,
    ),

  deleteExpense: (id: string) =>
    apiDelete<{ success: boolean; message?: string }>(
      `/financial/expenses/${id}`,
    ),
};
