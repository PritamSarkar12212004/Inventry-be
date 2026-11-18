import { useSyncExternalStore } from 'react';

export type SelectedStockItem = {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  unit: string;
};

export type StockSelectionState = {
  selectionMode: boolean;
  selectedCount: number;
  selectedMap: Record<string, SelectedStockItem>;
};

let state: StockSelectionState = {
  selectionMode: false,
  selectedCount: 0,
  selectedMap: {},
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const stockSelectionStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  startAndToggleItem: (item: SelectedStockItem) => {
    const nextMap = { ...state.selectedMap };
    if (nextMap[item.productId]) {
      delete nextMap[item.productId];
    } else {
      nextMap[item.productId] = item;
    }
    const count = Object.keys(nextMap).length;
    state = {
      selectionMode: count > 0,
      selectedCount: count,
      selectedMap: nextMap,
    };
    emitChange();
  },

  toggleItem: (item: SelectedStockItem) => {
    const nextMap = { ...state.selectedMap };
    if (nextMap[item.productId]) {
      delete nextMap[item.productId];
    } else {
      nextMap[item.productId] = item;
    }
    const count = Object.keys(nextMap).length;
    state = {
      selectionMode: count > 0,
      selectedCount: count,
      selectedMap: nextMap,
    };
    emitChange();
  },

  toggleCategoryItems: (items: SelectedStockItem[]) => {
    if (items.length === 0) return;
    const nextMap = { ...state.selectedMap };
    const allAlreadySelected = items.every((it) => Boolean(nextMap[it.productId]));

    if (allAlreadySelected) {
      for (const it of items) {
        delete nextMap[it.productId];
      }
    } else {
      for (const it of items) {
        nextMap[it.productId] = it;
      }
    }

    const count = Object.keys(nextMap).length;
    state = {
      selectionMode: count > 0,
      selectedCount: count,
      selectedMap: nextMap,
    };
    emitChange();
  },

  clear: () => {
    if (!state.selectionMode && state.selectedCount === 0) {
      return;
    }
    state = {
      selectionMode: false,
      selectedCount: 0,
      selectedMap: {},
    };
    emitChange();
  },
};

export function useStockSelectionStore() {
  return useSyncExternalStore(
    stockSelectionStore.subscribe,
    stockSelectionStore.getSnapshot,
  );
}
