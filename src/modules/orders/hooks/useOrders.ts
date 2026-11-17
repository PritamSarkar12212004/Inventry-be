import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { INVENTORY_QUERY_KEYS } from '../../inventory/hooks';
import { ordersApi } from '../api';
import type { CreateCustomerPayload, CreateSalesOrderPayload } from '../types';

export const ORDERS_QUERY_KEYS = {
  all: ['orders'] as const,
  customers: ['customers'] as const,
};

export function useInfiniteSalesOrders(search?: string, productId?: string) {
  return useInfiniteQuery({
    queryKey: ['orders', 'list', search, productId] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await ordersApi.getSalesOrders({
        page: pageParam,
        limit: 20,
        search: search || undefined,
        productId: productId || undefined,
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

export function useSalesOrderDetail(id: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id] as const,
    queryFn: async () => {
      const res = await ordersApi.getSalesOrderById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) =>
      ordersApi.createSalesOrder(payload),
    onSuccess: (res) => {
      if (res.data?._id) {
        queryClient.setQueryData(['orders', 'detail', res.data._id], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.customers });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
    },
  });
}

export function useInfiniteCustomers(search?: string) {
  return useInfiniteQuery({
    queryKey: ['customers', 'list', search] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await ordersApi.getCustomers({
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

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) =>
      ordersApi.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.customers });
    },
  });
}
