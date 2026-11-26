import type { PaginationMeta } from '../../inventory/types';

export type FinancialOverviewData = {
  totalOrders: number;
  paidOrdersCount?: number;
  partialOrdersCount?: number;
  unpaidOrdersCount?: number;
  totalSales: number;
  totalReceived: number;
  totalPendingDue: number;
  totalPurchaseEntries: number;
  totalPurchases: number;
  totalMaterialCost?: number;
  totalPurchaseTransportCost?: number;
  totalPurchaseOtherCost?: number;
  totalPurchaseExpenses?: number;
  totalExpenseCount: number;
  totalExpenses: number;
  totalInHouseExpenses?: number;
  totalAllExpenses?: number;
  totalStockValue: number;
  netCashflow: number;
};

export type ExpenseCategory =
  | 'RAW_MATERIAL'
  | 'PACKAGING'
  | 'IN_HOUSE_PRODUCTION'
  | 'SHIPPING_COURIER'
  | 'LABOUR_WAGES'
  | 'RENT_UTILITIES'
  | 'ELECTRICITY'
  | 'MARKETING'
  | 'TRANSPORT'
  | 'MAINTENANCE'
  | 'MISCELLANEOUS'
  | (string & {});

export type ExpenseCategoryItem = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  expenseCount?: number;
  titleCount?: number;
  totalAmount?: number;
  createdAt?: string;
};

export type ExpenseCategoryListResponse = {
  items: ExpenseCategoryItem[];
  pagination?: PaginationMeta;
};

export type CreateExpenseCategoryPayload = {
  name: string;
  description?: string;
};

export type ExpenseLineItem = {
  key: string;
  amount: number;
};

export type ExpenseItem = {
  _id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  expenseDate: string;
  notes?: string;
  product?: string | null;
  productName?: string | null;
  lineItems?: ExpenseLineItem[];
};

export type ExpenseListResponse = {
  items: ExpenseItem[];
  totals?: {
    amount: number;
    totalAmount: number;
  };
  pagination?: PaginationMeta;
};

export type ExpenseTitleItem = {
  key: string;
  title: string;
  count: number;
  totalAmount: number;
  latestDate?: string;
};

export type ExpenseTitleListResponse = {
  items: ExpenseTitleItem[];
  summary?: {
    totalAmount: number;
    totalEntries: number;
    totalItems: number;
  };
  pagination?: PaginationMeta;
};

export type CreateExpensePayload = {
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate?: string;
  notes?: string;
  productId?: string;
  productName?: string;
  lineItems?: ExpenseLineItem[];
};

export type CustomerOutstandingItem = {
  customerId: string | null;
  customerName: string;
  phone: string;
  billingAddress?: string;
  customerType?: string | null;
  creditLimit: number;
  creditLimitExceeded: boolean;
  pendingOrdersCount: number;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  oldestPendingDate: string | null;
  ageingDays: number;
  '0-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
};

export type CustomerOutstandingResponse = {
  totalReceivable: number;
  pendingCustomersCount: number;
  ageing: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  customers: CustomerOutstandingItem[];
};

export type PurchaseEntryLineItem = {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
};

export type PurchaseEntryDetailItem = {
  id: string;
  entryNumber: string;
  entryDate: string;
  supplierName: string;
  supplierPhone: string;
  supplierGstin: string;
  unitPurchaseCost: number;
  materialCost: number;
  transportCost: number;
  otherCost: number;
  totalPurchaseCost: number;
  remarks: string;
  items: PurchaseEntryLineItem[];
};

export type SupplierSummaryItem = {
  supplierName: string;
  supplierPhone: string;
  supplierGstin: string;
  entryCount: number;
  totalPurchaseCost: number;
  materialCost: number;
  transportCost: number;
  otherCost: number;
  lastPurchaseDate: string;
  entries: PurchaseEntryDetailItem[];
};

export type ExpenseRecordDetail = {
  id: string;
  referenceNumber: string;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: string;
  notes: string;
};

export type ExpenseBreakdownItem = {
  key: string;
  label: string;
  count: number;
  totalAmount: number;
  records: ExpenseRecordDetail[];
};

export type PurchaseExpenseSummaryResponse = {
  summary: {
    totalPurchases: number;
    totalPurchaseEntries: number;
    totalMaterialCost: number;
    totalTransportCost: number;
    totalOtherPurchaseCost: number;
    totalStandaloneExpenses: number;
    totalExpenseCount: number;
    totalAllExpenses: number;
    grandTotalSpend: number;
    supplierCount: number;
  };
  expenseBreakdown: ExpenseBreakdownItem[];
  suppliers: SupplierSummaryItem[];
  purchases: PurchaseEntryDetailItem[];
};
