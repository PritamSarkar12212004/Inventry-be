import { useSyncExternalStore } from 'react';
import { secureStorage } from '../storage/secureStorage';

type AuthState = {
  isAuthenticated: boolean;
  isHydrating: boolean;
};

let state: AuthState = {
  isAuthenticated: false,
  isHydrating: true,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  hydrate: async () => {
    try {
      const tokens = await secureStorage.getTokens();
      state = {
        isAuthenticated: Boolean(tokens?.accessToken),
        isHydrating: false,
      };
    } catch {
      state = { isAuthenticated: false, isHydrating: false };
    }
    emitChange();
  },
  login: () => {
    state = { isAuthenticated: true, isHydrating: false };
    emitChange();
  },
  logout: () => {
    state = { isAuthenticated: false, isHydrating: false };
    emitChange();
  },
};

export function useAuthStore() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
