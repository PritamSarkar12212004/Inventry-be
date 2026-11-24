import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { INVENTORY_QUERY_KEYS } from '../../inventory/hooks';
import { ordersApi } from '../api';
import type {
  CreateCustomerPayload,
  CreateSalesOrderPayload,
  CustomerItem,
  CustomerSortBy,
  OrderSortBy,
  RecordOrderPaymentPayload,
} from '../types';

export const ORDERS_QUERY_KEYS = {
  all: ['orders'] as const,
  customers: ['customers'] as const,
};

export function useInfiniteSalesOrders(
  search?: string,
  productId?: string,
  sortBy?: OrderSortBy,
  customerId?: string,
  pendingOnly?: boolean,
) {
  return useInfiniteQuery({
    queryKey: [
      'orders',
      'list',
      search,
      productId,
      sortBy,
      customerId,
      Boolean(pendingOnly),
    ] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await ordersApi.getSalesOrders({
        page: pageParam,
        limit: 20,
        search: search || undefined,
        productId: productId || undefined,
        customerId: customerId || undefined,
        pendingOnly: pendingOnly ? true : undefined,
        sortBy: sortBy && sortBy !== 'DATE_DESC' ? sortBy : undefined,
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
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}

export function useInfiniteCustomers(search?: string, sortBy?: CustomerSortBy) {
  return useInfiniteQuery({
    queryKey: ['customers', 'list', search, sortBy] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await ordersApi.getCustomers({
        page: pageParam,
        limit: 20,
        search: search || undefined,
        sortBy: sortBy && sortBy !== 'NEWEST' ? sortBy : undefined,
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

export function useRecordOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: RecordOrderPaymentPayload;
    }) => ordersApi.recordOrderPayment(orderId, payload),
    onSuccess: (res, variables) => {
      if (res.data) {
        queryClient.setQueryData(
          ['orders', 'detail', variables.orderId],
          res.data,
        );
      }
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.customers });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}

export function useCustomerDetail(id: string, initialData?: CustomerItem) {
  return useQuery({
    queryKey: ['customers', 'detail', id] as const,
    queryFn: async () => {
      const res = await ordersApi.getCustomerById(id);
      return res.data;
    },
    initialData,
    enabled: Boolean(id),
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.deleteSalesOrder(orderId),
    onSuccess: (_res, orderId) => {
      queryClient.removeQueries({ queryKey: ['orders', 'detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.customers });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}

export function useSendCustomerPaymentReminder() {
  return useMutation({
    mutationFn: (customerId: string) =>
      ordersApi.sendCustomerPaymentReminder(customerId),
  });
}

export function useSendAllPaymentReminders() {
  return useMutation({
    mutationFn: () => ordersApi.sendAllPaymentReminders(),
  });
}
