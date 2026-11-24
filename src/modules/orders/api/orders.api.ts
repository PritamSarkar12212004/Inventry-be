import { apiDelete, apiGet, apiPost } from '../../../core/api';
import type {
  CreateCustomerPayload,
  CreateSalesOrderPayload,
  CustomerItem,
  CustomerListResponse,
  CustomerSortBy,
  OrderSortBy,
  RecordOrderPaymentPayload,
  SalesOrderListResponse,
  SalesOrderRecord,
} from '../types';

export const ordersApi = {
  getSalesOrders: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    customerId?: string;
    pendingOnly?: boolean;
    sortBy?: OrderSortBy;
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

  recordOrderPayment: (orderId: string, payload: RecordOrderPaymentPayload) =>
    apiPost<{ success: boolean; data: SalesOrderRecord }, RecordOrderPaymentPayload>(
      `/sales-orders/${orderId}/payments`,
      payload,
    ),

  deleteSalesOrder: (orderId: string) =>
    apiDelete<{ success: boolean; message?: string }>(
      `/sales-orders/${orderId}`,
    ),

  getCustomers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: CustomerSortBy;
  }) =>
    apiGet<{ success: boolean; data: CustomerListResponse }>(
      '/customers',
      params,
    ),

  getCustomerById: (id: string) =>
    apiGet<{ success: boolean; data: CustomerItem }>(`/customers/${id}`),

  createCustomer: (payload: CreateCustomerPayload) =>
    apiPost<{ success: boolean; data: CustomerItem }, CreateCustomerPayload>(
      '/customers',
      payload,
    ),

  sendCustomerPaymentReminder: (customerId: string) =>
    apiPost<
      {
        success: boolean;
        message?: string;
        data?: { invoiceCount: number; totalDue: number };
      },
      Record<string, never>
    >(`/sales-orders/customer/${customerId}/payment-reminder`, {}),

  sendAllPaymentReminders: () =>
    apiPost<
      {
        success: boolean;
        message?: string;
        data?: { totalCustomers: number; totalInvoices: number };
      },
      Record<string, never>
    >('/sales-orders/payment-reminders/send-all', {}),
};
