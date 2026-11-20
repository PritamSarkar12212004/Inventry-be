import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { financialApi } from '../api';
import type { CreateExpensePayload } from '../types';

export const FINANCIAL_QUERY_KEYS = {
  all: ['financial'] as const,
  overview: ['financial', 'overview'] as const,
  customerOutstanding: (search?: string) =>
    ['financial', 'customer-outstanding', search] as const,
  purchaseExpenseSummary: (search?: string) =>
    ['financial', 'purchase-expense-summary', search] as const,
  productExpenses: (productId: string) =>
    ['financial', 'product-expenses', productId] as const,
  expenses: (search?: string) => ['financial', 'expenses', search] as const,
};

export function useFinancialOverview() {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.overview,
    queryFn: async () => {
      const res = await financialApi.getOverview();
      return res.data;
    },
  });
}

export function useCustomerOutstanding(search?: string) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.customerOutstanding(search),
    queryFn: async () => {
      const res = await financialApi.getCustomerOutstanding(search);
      return res.data;
    },
  });
}

export function usePurchaseExpenseSummary(search?: string) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.purchaseExpenseSummary(search),
    queryFn: async () => {
      const res = await financialApi.getPurchaseExpenseSummary(search);
      return res.data;
    },
  });
}

export function useProductExpenses(productId: string) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.productExpenses(productId),
    queryFn: async () => {
      const res = await financialApi.getExpenses({
        productId,
        page: 1,
        limit: 50,
      });
      return res.data?.items ?? [];
    },
    enabled: Boolean(productId),
  });
}

export function useInfiniteExpenses(search?: string) {
  return useInfiniteQuery({
    queryKey: FINANCIAL_QUERY_KEYS.expenses(search),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await financialApi.getExpenses({
        page: pageParam,
        limit: 20,
        search: search || undefined,
      });
      return {
        items: res.data?.items ?? [],
        pagination: res.data?.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      if (!p || p.page >= p.totalPages) return undefined;
      return p.page + 1;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      financialApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEYS.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEYS.all });
    },
  });
}
