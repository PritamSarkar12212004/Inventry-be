import { apiDelete, apiGet, apiPatch, apiPost } from '../../../core/api';
import { INVENTORY_PATHS } from '../constants';
import type {
  AnalyticsPeriod,
  CategoryItem,
  CreateProductPayload,
  CreateProductResponse,
  CreateStockEntryPayload,
  CreateSupplierPayload,
  InventoryListResponse,
  InventorySummaryData,
  PaginationMeta,
  ProductAnalyticsData,
  ProductDetailData,
  StockEntryRecord,
  StockEntryResponse,
  StockMovementItem,
  SupplierItem,
  SupplierSortBy,
} from '../types';

export type InventoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
  stockFilter?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
};

export const inventoryApi = {
  getList: (params?: InventoryListParams) =>
    apiGet<InventoryListResponse>(INVENTORY_PATHS.list, params),

  getSummary: () =>
    apiGet<{ success: boolean; data: InventorySummaryData }>(
      INVENTORY_PATHS.summary,
    ),

  createStockEntry: (payload: CreateStockEntryPayload) =>
    apiPost<StockEntryResponse, CreateStockEntryPayload>(
      INVENTORY_PATHS.stockEntries,
      payload,
    ),

  createProduct: (payload: CreateProductPayload) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.category) {
      formData.append('category', payload.category);
    }

    if (payload.purchaseCost !== undefined) {
      formData.append('purchaseCost', String(payload.purchaseCost));
    }

    (payload.imageUris ?? []).slice(0, 10).forEach((uri, index) => {
      const filename = uri.split('/').pop() || `product_${index + 1}.jpg`;
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('images', {
        uri,
        name: filename,
        type: mime,
      } as unknown as Blob);
    });

    return apiPost<CreateProductResponse, FormData>(
      INVENTORY_PATHS.products,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
  },

  getCategories: (search?: string) =>
    apiGet<{ success: boolean; data: CategoryItem[] }>(
      INVENTORY_PATHS.categories,
      search ? { search } : undefined,
    ),

  createCategory: (name: string) =>
    apiPost<{ success: boolean; data: CategoryItem }, { name: string }>(
      INVENTORY_PATHS.categories,
      { name },
    ),

  getSuppliers: (
    search?: string,
    page = 1,
    limit = 20,
    sortBy?: SupplierSortBy,
  ) =>
    apiGet<{
      success: boolean;
      data: { items: SupplierItem[]; pagination?: PaginationMeta };
    }>(INVENTORY_PATHS.suppliers, {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(sortBy && sortBy !== 'NEWEST' ? { sortBy } : {}),
    }),

  getSupplierStockEntries: (params: {
    supplierName: string;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    apiGet<{
      success: boolean;
      data: { items: StockEntryRecord[]; pagination?: PaginationMeta };
    }>(INVENTORY_PATHS.stockEntries, params),

  createSupplier: (payload: CreateSupplierPayload) =>
    apiPost<{ success: boolean; data: SupplierItem }, CreateSupplierPayload>(
      INVENTORY_PATHS.suppliers,
      payload,
    ),

  getProductById: (productId: string) =>
    apiGet<{ success: boolean; data: ProductDetailData }>(
      `${INVENTORY_PATHS.products}/${productId}`,
    ),

  getProductMovements: (productId: string) =>
    apiGet<{
      success: boolean;
      data: { items?: StockMovementItem[]; movements?: StockMovementItem[] };
    }>(INVENTORY_PATHS.movements, { productId, limit: 15 }),

  getProductStockEntries: (productId: string) =>
    apiGet<{
      success: boolean;
      data: { items?: StockEntryRecord[] };
    }>(INVENTORY_PATHS.stockEntries, { productId, limit: 50 }),

  getProductAnalytics: (
    productId: string,
    period: AnalyticsPeriod,
    year?: number,
  ) =>
    apiGet<{ success: boolean; data: ProductAnalyticsData }>(
      `${INVENTORY_PATHS.productAnalytics}/${productId}`,
      { period, ...(year ? { year } : {}) },
    ),

  updateProduct: (
    productId: string,
    payload: { name?: string; category?: string },
  ) =>
    apiPatch<{ success: boolean; data: ProductDetailData }>(
      `${INVENTORY_PATHS.products}/${productId}`,
      payload,
    ),

  addProductImages: (productId: string, imageUris: string[]) => {
    const formData = new FormData();
    imageUris.slice(0, 10).forEach((uri, index) => {
      const filename = uri.split('/').pop() || `product_${index + 1}.jpg`;
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('images', {
        uri,
        name: filename,
        type: mime,
      } as unknown as Blob);
    });

    return apiPost<{ success: boolean; data: unknown }, FormData>(
      `${INVENTORY_PATHS.products}/${productId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
  },

  deleteProductImage: (productId: string, imageId: string) =>
    apiDelete<{ success: boolean; data: unknown }>(
      `${INVENTORY_PATHS.products}/${productId}/images/${imageId}`,
    ),

  deleteProduct: (productId: string) =>
    apiDelete<{ success: boolean; message?: string }>(
      `${INVENTORY_PATHS.products}/${productId}?permanent=true`,
    ),
};
