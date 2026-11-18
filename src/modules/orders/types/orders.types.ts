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
  totalOrders?: number;
  totalProductsBought?: number;
  totalSpent?: number;
  totalPaid?: number;
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
  advancePaid?: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentHistory?: OrderPaymentEntry[];
  fulfillmentStatus: string;
  paymentTerms?: string;
  notes?: string;
};

export type PaymentMode =
  | 'CASH'
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CHEQUE'
  | 'OTHER';

export type OrderSortBy =
  | 'DATE_DESC'
  | 'PAID_DESC'
  | 'PAID_ASC'
  | 'AMOUNT_DESC'
  | 'AMOUNT_ASC'
  | 'DATE_ASC';

export type CustomerSortBy =
  | 'NEWEST'
  | 'SPENT_DESC'
  | 'SPENT_ASC'
  | 'ORDERS_DESC'
  | 'ORDERS_ASC'
  | 'NAME_ASC';

export type OrderPaymentEntry = {
  _id?: string;
  amount: number;
  paymentMode: PaymentMode;
  paidAt: string;
  note?: string;
};

export type RecordOrderPaymentPayload = {
  amount: number;
  paymentMode?: PaymentMode;
  note?: string;
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
