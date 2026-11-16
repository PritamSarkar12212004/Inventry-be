import { useSyncExternalStore } from 'react';

type AuthState = {
  isAuthenticated: boolean;
};

let state: AuthState = {
  isAuthenticated: false,
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
  login: () => {
    state = { isAuthenticated: true };
    emitChange();
  },
  logout: () => {
    state = { isAuthenticated: false };
    emitChange();
  },
};

export function useAuthStore() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
