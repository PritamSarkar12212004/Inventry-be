import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { financialApi } from '../api';
import type {
  CreateExpenseCategoryPayload,
  CreateExpensePayload,
} from '../types';

export const FINANCIAL_QUERY_KEYS = {
  all: ['financial'] as const,
  overview: ['financial', 'overview'] as const,
  customerOutstanding: (search?: string) =>
    ['financial', 'customer-outstanding', search] as const,
  purchaseExpenseSummary: (search?: string) =>
    ['financial', 'purchase-expense-summary', search] as const,
  productExpenses: (productId: string) =>
    ['financial', 'product-expenses', productId] as const,
  expenses: (
    search?: string,
    category?: string,
    title?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    [
      'financial',
      'expenses',
      search,
      category,
      title,
      startDate,
      endDate,
    ] as const,
  expenseTitles: (
    search?: string,
    category?: string,
    startDate?: string,
    endDate?: string,
    limit = 15,
  ) =>
    [
      'financial',
      'expense-titles',
      search,
      category,
      startDate,
      endDate,
      limit,
    ] as const,
  expenseCategories: (
    search?: string,
    startDate?: string,
    endDate?: string,
    limit = 12,
  ) =>
    [
      'financial',
      'expense-categories',
      search,
      startDate,
      endDate,
      limit,
    ] as const,
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

export function useInfiniteExpenses(
  search?: string,
  category?: string,
  title?: string,
  startDate?: string,
  endDate?: string,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: FINANCIAL_QUERY_KEYS.expenses(
      search,
      category,
      title,
      startDate,
      endDate,
    ),
    initialPageParam: 1,
    enabled,
    queryFn: async ({ pageParam }) => {
      const res = await financialApi.getExpenses({
        page: pageParam,
        limit: 20,
        search: search || undefined,
        category: category || undefined,
        title: title || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return {
        items: res.data?.items ?? [],
        totals: res.data?.totals,
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

export function useInfiniteExpenseTitles(
  search?: string,
  category?: string,
  enabled = true,
  startDate?: string,
  endDate?: string,
  limit = 15,
) {
  return useInfiniteQuery({
    queryKey: FINANCIAL_QUERY_KEYS.expenseTitles(
      search,
      category,
      startDate,
      endDate,
      limit,
    ),
    initialPageParam: 1,
    enabled,
    queryFn: async ({ pageParam }) => {
      const res = await financialApi.getExpenseTitles({
        page: pageParam,
        limit,
        search: search || undefined,
        category: category || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return {
        items: res.data?.items ?? [],
        summary: res.data?.summary,
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

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateExpensePayload>;
    }) => financialApi.updateExpense(id, payload),
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

export function useInfiniteExpenseCategories(
  search?: string,
  startDate?: string,
  endDate?: string,
  limit = 12,
) {
  return useInfiniteQuery({
    queryKey: FINANCIAL_QUERY_KEYS.expenseCategories(
      search,
      startDate,
      endDate,
      limit,
    ),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await financialApi.getExpenseCategories({
        page: pageParam,
        limit,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return {
        items: res.data?.items ?? [],
        overview: res.data?.overview,
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

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryPayload) =>
      financialApi.createExpenseCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['financial', 'expense-categories'],
      });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialApi.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['financial', 'expense-categories'],
      });
    },
  });
}
