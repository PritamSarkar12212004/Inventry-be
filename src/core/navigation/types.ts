import type {
  CustomerOutstandingItem,
  ExpenseBreakdownItem,
  PurchaseEntryDetailItem,
  SupplierSummaryItem,
} from '../../modules/financial/types';

export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string };
};

export type StockTopTabsParamList = {
  AllStock: undefined;
  LowStock: undefined;
};

export type SalesTopTabsParamList = {
  SalesOrders: undefined;
  Customers: undefined;
  Suppliers: undefined;
};

export type ExpensesTopTabsParamList = {
  GeneralExpenses: undefined;
  ManpowerExpenses: undefined;
};

export type PurchaseTopTabsParamList = {
  PurchaseOrders: undefined;
  GrnList: undefined;
  PurchaseReturns: undefined;
  Suppliers: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Manufacturing: undefined;
  ReturnsDamage: undefined;
  Financial: undefined;
  Reports: undefined;
  Settings: undefined;
  Sessions: undefined;
};

export type MainTabsParamList = {
  HomeTab: undefined;
  StockTab: undefined;
  SalesTab: undefined;
  ReceiveTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Finance: undefined;
  BusinessHub: undefined;
  BusinessSettings: undefined;
  PaymentQr: undefined;
  Reminders: undefined;
  PaymentReminder: undefined;
  SamplePdf: undefined;
  StockReminder: undefined;
  Main: undefined;
  StockOverviewDetail: undefined;
  SalesOverviewDetail: undefined;
  FinancialOverviewDetail: undefined;
  SupplierOverviewDetail: undefined;
  ProductDetail: { productId: string };
  ProductForm: { productId?: string } | undefined;
  CustomerDetail: {
    customer: {
      _id: string;
      name: string;
      phone?: string;
      billingAddress?: string;
      shippingAddress?: string;
      address?: string;
      gstin?: string | null;
      totalOrders?: number;
      totalSpent?: number;
      totalPaid?: number;
    };
  };
  SalesOrderDetail: { orderId: string };
  SalesOrderForm: undefined;
  StockEntryForm:
    | {
        productId?: string;
        productName?: string;
        currentStock?: number;
        unit?: string;
      }
    | undefined;
  InvoiceDetail: { invoiceId: string };
  CustomerPendingDetail: { customer: CustomerOutstandingItem };
  SupplierPurchaseDetail: {
    title: string;
    subtitle?: string;
    mode: 'ALL_PURCHASES' | 'SUPPLIER' | 'EXPENSE_CATEGORY';
    supplier?: SupplierSummaryItem;
    category?: ExpenseBreakdownItem;
    purchases?: PurchaseEntryDetailItem[];
    summaryStats?: {
      totalAmount: number;
      materialCost: number;
      transportCost: number;
      otherCost: number;
      count: number;
    };
  };
  GrnForm: { poId?: string } | undefined;
  DamageForm: undefined;
};
