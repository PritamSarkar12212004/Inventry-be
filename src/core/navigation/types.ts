export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string };
};

export type StockTopTabsParamList = {
  AllStock: undefined;
  LowStock: undefined;
  Batches: undefined;
  StockAudits: undefined;
};

export type SalesTopTabsParamList = {
  SalesOrders: undefined;
  Dispatches: undefined;
  Invoices: undefined;
  Customers: undefined;
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
  Main: undefined;
  ProductDetail: { productId: string };
  ProductForm: { productId?: string } | undefined;
  StockEntryForm:
    | {
        productId?: string;
        productName?: string;
        currentStock?: number;
        unit?: string;
      }
    | undefined;
  InvoiceDetail: { invoiceId: string };
  GrnForm: { poId?: string } | undefined;
  DamageForm: undefined;
};
