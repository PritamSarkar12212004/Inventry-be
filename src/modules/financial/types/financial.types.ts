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
  totalGeneralExpenses?: number;
  generalExpenseCount?: number;
  totalManpowerExpenses?: number;
  manpowerExpenseCount?: number;
  totalInHouseExpenses?: number;
  totalAllExpenses?: number;
  totalStockValue: number;
  netCashflow: number;
};

export type FinancialTransactionType =
  | 'ALL'
  | 'IN'
  | 'OUT'
  | 'SALES_PAYMENT'
  | 'PURCHASE'
  | 'GENERAL_EXPENSE'
  | 'MANPOWER';

export type FinancialTransactionItem = {
  id: string;
  direction: 'IN' | 'OUT';
  type: 'SALES_PAYMENT' | 'PURCHASE' | 'GENERAL_EXPENSE' | 'MANPOWER';
  title: string;
  subtitle: string;
  referenceNumber: string;
  paymentMode: string;
  amount: number;
  date: string;
  orderId?: string;
  category?: string;
  notes?: string;
};

export type FinancialPaymentModeStat = {
  mode: string;
  inAmount: number;
  outAmount: number;
  count: number;
};

export type FinancialTransactionsResponse = {
  summary: {
    totalIn: number;
    totalOut: number;
    netFlow: number;
    inCount: number;
    outCount: number;
    totalCount: number;
    byPaymentMode: FinancialPaymentModeStat[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  transactions: FinancialTransactionItem[];
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

export type ExpenseCategoryOverview = {
  totalCategories: number;
  totalExpenses: number;
  totalEntries: number;
  thisMonthAmount: number;
  topCategory?: {
    name: string;
    totalAmount: number;
  } | null;
};

export type ExpenseCategoryListResponse = {
  items: ExpenseCategoryItem[];
  overview?: ExpenseCategoryOverview;
  pagination?: PaginationMeta;
};

export type CreateExpenseCategoryPayload = {
  name: string;
  description?: string;
};

export type ManpowerWorkType = 'CONTRACT' | 'SALARY' | 'DAILY_WAGE';

export type ManpowerDetails = {
  workType?: ManpowerWorkType;
  workItem?: string;
  units?: number;
  ratePerUnit?: number;
  paidAmount?: number;
  pendingAmount?: number;
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
  manpowerDetails?: ManpowerDetails | null;
};

export type ExpenseListResponse = {
  items: ExpenseItem[];
  totals?: {
    amount: number;
    totalAmount: number;
    paidAmount?: number;
    pendingAmount?: number;
  };
  pagination?: PaginationMeta;
};

export type ExpenseTitleItem = {
  key: string;
  title: string;
  count: number;
  totalAmount: number;
  totalPaid?: number;
  totalPending?: number;
  workTypes?: ManpowerWorkType[];
  latestDate?: string;
};

export type ExpenseTitleListResponse = {
  items: ExpenseTitleItem[];
  summary?: {
    totalAmount: number;
    totalPaid?: number;
    totalPending?: number;
    totalEntries: number;
    totalItems: number;
    thisMonthAmount?: number;
    topItem?: {
      title: string;
      totalAmount: number;
    } | null;
    availableWorkTypes?: ManpowerWorkType[];
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
  manpowerDetails?: ManpowerDetails;
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
