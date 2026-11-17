import type { PaginationMeta } from '../../inventory/types';

export type CustomerItem = {
  _id: string;
  customerCode?: string;
  name: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  shippingAddress?: string;
  address?: string;
  gstin?: string | null;
  customerType?: string;
};

export type CustomerListResponse = {
  items: CustomerItem[];
  pagination?: PaginationMeta;
};

export type CreateCustomerPayload = {
  name: string;
  phone?: string;
  billingAddress?: string;
  gstin?: string;
};

export type SalesOrderItem = {
  _id?: string;
  product: string;
  productCode: string;
  productName: string;
  hsnCode?: string;
  unit: string;
  orderedQuantity: number;
  sellingPrice: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
};

export type SalesOrderRecord = {
  _id: string;
  orderNumber: string;
  orderDate: string;
  customer?: string | null;
  customerSnapshot: {
    name: string;
    phone?: string | null;
    customerType?: string;
    gstin?: string | null;
  };
  billingAddress?: string;
  items: SalesOrderItem[];
  subtotal: number;
  discount: number;
  includeGst?: boolean;
  tax: number;
  shippingCharges: number;
  grandTotal: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  fulfillmentStatus: string;
  paymentTerms?: string;
  notes?: string;
};

export type SalesOrderListResponse = {
  items: SalesOrderRecord[];
  pagination?: PaginationMeta;
};

export type CreateSalesOrderPayload = {
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  billingAddress?: string;
  includeGst: boolean;
  notes?: string;
  items: Array<{
    productId: string;
    orderedQuantity: number;
    sellingPrice: number;
    gstRate?: number;
  }>;
};
