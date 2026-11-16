import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type InventoryListParams } from '../api';
import { inventoryLogger } from '../logs';
import type {
  AnalyticsPeriod,
  CreateProductPayload,
  CreateStockEntryPayload,
  CreateSupplierPayload,
  StockSourceType,
} from '../types';

export const INVENTORY_QUERY_KEYS = {
  all: ['inventory'] as const,
  list: (params?: InventoryListParams) => ['inventory', 'list', params] as const,
  categories: (search?: string) => ['inventory', 'categories', search] as const,
  suppliers: (search?: string) => ['inventory', 'suppliers', search] as const,
  detail: (productId: string) => ['inventory', 'detail', productId] as const,
  movements: (productId: string) =>
    ['inventory', 'movements', productId] as const,
  stockEntries: (productId: string) =>
    ['inventory', 'stockEntries', productId] as const,
  analytics: (productId: string, period: AnalyticsPeriod, year?: number) =>
    ['inventory', 'analytics', productId, period, year] as const,
};

export function useInventoryList(params?: InventoryListParams) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.list(params),
    queryFn: async () => {
      const res = await inventoryApi.getList(params);
      inventoryLogger.info('getList:success', res.data);
      return res.data?.items ?? res.data?.records ?? [];
    },
  });
}

export function useCreateStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockEntryPayload) =>
      inventoryApi.createStockEntry(payload),
    onSuccess: (res) => {
      inventoryLogger.info('createStockEntry:success', res);
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
    },
    onError: (err) => {
      inventoryLogger.error('createStockEntry:error', err);
    },
  });
}

export type CreateProductAndStockInput = {
  product: CreateProductPayload;
  quantity: number;
  sourceType: StockSourceType;
  supplierName?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  unitPurchaseCost?: number;
  transportCost?: number;
  otherCost?: number;
  totalPurchaseCost?: number;
  remarks?: string;
};

export function useCreateProductAndStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      product,
      quantity,
      sourceType,
      supplierName,
      supplierPhone,
      supplierGstin,
      unitPurchaseCost,
      transportCost,
      otherCost,
      totalPurchaseCost,
      remarks,
    }: CreateProductAndStockInput) => {
      const created = await inventoryApi.createProduct(product);
      const productId = created.data._id;

      await inventoryApi.createStockEntry({
        remarks: remarks || 'Opening stock',
        sourceType,
        supplierName,
        supplierPhone,
        supplierGstin,
        unitPurchaseCost,
        transportCost,
        otherCost,
        totalPurchaseCost,
        items: [{ productId, quantity }],
      });

      return created;
    },
    onSuccess: (res) => {
      inventoryLogger.info('createProductAndStock:success', res);
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
    },
    onError: (err) => {
      inventoryLogger.error('createProductAndStock:error', err);
    },
  });
}

export function useCategories(search?: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.categories(search),
    queryFn: async () => {
      const res = await inventoryApi.getCategories(search);
      return res.data ?? [];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => inventoryApi.createCategory(name),
    onSuccess: (res) => {
      inventoryLogger.info('createCategory:success', res);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
    },
    onError: (err) => {
      inventoryLogger.error('createCategory:error', err);
    },
  });
}

export function useSuppliers(search?: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.suppliers(search),
    queryFn: async () => {
      const res = await inventoryApi.getSuppliers(search);
      inventoryLogger.info('getSuppliers:success', res.data);
      return res.data?.items ?? [];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) =>
      inventoryApi.createSupplier(payload),
    onSuccess: (res) => {
      inventoryLogger.info('createSupplier:success', res);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
    },
    onError: (err) => {
      inventoryLogger.error('createSupplier:error', err);
    },
  });
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.detail(productId),
    queryFn: async () => {
      const res = await inventoryApi.getProductById(productId);
      inventoryLogger.info('getProductById:success', res.data);
      return res.data;
    },
    enabled: Boolean(productId),
  });
}

export function useProductMovements(productId: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.movements(productId),
    queryFn: async () => {
      const res = await inventoryApi.getProductMovements(productId);
      return res.data?.items ?? res.data?.movements ?? [];
    },
    enabled: Boolean(productId),
  });
}

export function useProductStockEntries(productId: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.stockEntries(productId),
    queryFn: async () => {
      const res = await inventoryApi.getProductStockEntries(productId);
      return res.data?.items ?? [];
    },
    enabled: Boolean(productId),
  });
}

export function useProductAnalytics(
  productId: string,
  period: AnalyticsPeriod,
  year?: number,
) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.analytics(productId, period, year),
    queryFn: async () => {
      const res = await inventoryApi.getProductAnalytics(
        productId,
        period,
        year,
      );
      return res.data;
    },
    enabled: Boolean(productId),
  });
}

export type UpdateProductBasicInput = {
  productId: string;
  name?: string;
  category?: string;
  removedImageIds: string[];
  newImageUris: string[];
};

export function useUpdateProductBasicDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      name,
      category,
      removedImageIds,
      newImageUris,
    }: UpdateProductBasicInput) => {
      if (name !== undefined || category !== undefined) {
        await inventoryApi.updateProduct(productId, {
          ...(name !== undefined ? { name } : {}),
          ...(category !== undefined ? { category } : {}),
        });
      }

      for (const imageId of removedImageIds) {
        await inventoryApi.deleteProductImage(productId, imageId);
      }

      if (newImageUris.length > 0) {
        await inventoryApi.addProductImages(productId, newImageUris);
      }
    },
    onSuccess: (_data, variables) => {
      inventoryLogger.info('updateProductBasic:success', variables.productId);
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.detail(variables.productId),
      });
    },
    onError: (err) => {
      inventoryLogger.error('updateProductBasic:error', err);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => inventoryApi.deleteProduct(productId),
    onSuccess: (_data, productId) => {
      inventoryLogger.info('deleteProduct:success', productId);
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
    },
    onError: (err) => {
      inventoryLogger.error('deleteProduct:error', err);
    },
  });
}
