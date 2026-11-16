export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type StockSourceType = 'SELF_MADE' | 'PURCHASED';

export type ProductImageItem =
  | string
  | {
      _id?: string;
      url: string;
      isPrimary?: boolean;
    };

export type InventoryItem = {
  productId: string;
  productCode: string;
  productName: string;
  category?: string;
  inventoryType: string;
  unit: string;
  images: ProductImageItem[];
  defaultSellingPrice: number;
  lowStockThreshold: number;
  currentStock: number;
  availableQuantity: number;
  stockValue: number;
  stockStatus: StockStatus;
};

export type InventoryListResponse = {
  success: boolean;
  message?: string;
  data: {
    items?: InventoryItem[];
    records?: InventoryItem[];
    total?: number;
  };
};

export type CreateStockEntryPayload = {
  remarks?: string;
  sourceType: StockSourceType;
  supplierName?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  unitPurchaseCost?: number;
  transportCost?: number;
  otherCost?: number;
  totalPurchaseCost?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type StockEntryResponse = {
  success: boolean;
  message?: string;
  data: unknown;
};

export type CategoryItem = {
  id: string;
  name: string;
};

export type SupplierItem = {
  id: string;
  name: string;
  phone: string;
  supplierCode?: string;
};

export type CreateSupplierPayload = {
  name: string;
  phone: string;
};

export type ProductDetailData = {
  id: string;
  productCode: string;
  name: string;
  category?: string;
  description?: string;
  unit?: string;
  images: ProductImageItem[];
  currentStock: number;
  purchaseCost?: number;
  defaultSellingPrice?: number;
  lowStockThreshold?: number;
  status?: string;
  createdAt?: string;
};

export type StockMovementItem = {
  _id: string;
  movementType: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  remarks?: string;
  createdAt: string;
};

export type StockEntryRecord = {
  id: string;
  entryNumber: string;
  entryDate: string;
  sourceType?: StockSourceType;
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierGstin?: string | null;
  unitPurchaseCost?: number;
  transportCost?: number;
  otherCost?: number;
  totalPurchaseCost?: number;
  remarks?: string;
  items: Array<{
    product: string;
    productCode: string;
    productName: string;
    quantity: number;
  }>;
  createdBy?: {
    name?: string;
    phone?: string;
  } | null;
};

export type AnalyticsPeriod = 'month' | 'year';

export type ProductAnalyticsPoint = {
  label: string;
  added: number;
  sold: number;
};

export type ProductAnalyticsData = {
  period: AnalyticsPeriod;
  year: number;
  availableYears: number[];
  points: ProductAnalyticsPoint[];
  totals: {
    added: number;
    sold: number;
  };
};

export type CreateProductPayload = {
  name: string;
  category?: string;
  purchaseCost?: number;
  imageUris?: string[];
};

export type CreateProductResponse = {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    productCode: string;
    name: string;
  };
};
