import { apiGet, apiPost } from '../../../core/api';
import type {
  CreateCustomerPayload,
  CreateSalesOrderPayload,
  CustomerItem,
  CustomerListResponse,
  SalesOrderListResponse,
  SalesOrderRecord,
} from '../types';

export const ordersApi = {
  getSalesOrders: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
  }) =>
    apiGet<{ success: boolean; data: SalesOrderListResponse }>(
      '/sales-orders',
      params,
    ),

  getSalesOrderById: (id: string) =>
    apiGet<{ success: boolean; data: SalesOrderRecord }>(`/sales-orders/${id}`),

  createSalesOrder: (payload: CreateSalesOrderPayload) =>
    apiPost<{ success: boolean; data: SalesOrderRecord }, CreateSalesOrderPayload>(
      '/sales-orders',
      payload,
    ),

  getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<{ success: boolean; data: CustomerListResponse }>(
      '/customers',
      params,
    ),

  createCustomer: (payload: CreateCustomerPayload) =>
    apiPost<{ success: boolean; data: CustomerItem }, CreateCustomerPayload>(
      '/customers',
      payload,
    ),
};
