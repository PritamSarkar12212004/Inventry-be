import { useSyncExternalStore } from 'react';
import { secureStorage } from '../storage/secureStorage';

type AuthState = {
  isAuthenticated: boolean;
  isProfileCompleted: boolean;
  isHydrating: boolean;
};

let state: AuthState = {
  isAuthenticated: false,
  isProfileCompleted: false,
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
      const [tokens, profileDone] = await Promise.all([
        secureStorage.getTokens(),
        secureStorage.isProfileCompleted(),
      ]);
      state = {
        isAuthenticated: Boolean(tokens?.accessToken),
        isProfileCompleted: Boolean(tokens?.accessToken) && profileDone,
        isHydrating: false,
      };
    } catch {
      state = {
        isAuthenticated: false,
        isProfileCompleted: false,
        isHydrating: false,
      };
    }
    emitChange();
  },
  login: () => {
    state = { ...state, isAuthenticated: true, isHydrating: false };
    emitChange();
  },
  completeProfile: async () => {
    await secureStorage.setProfileCompleted(true);
    state = {
      isAuthenticated: true,
      isProfileCompleted: true,
      isHydrating: false,
    };
    emitChange();
  },
  logout: () => {
    state = {
      isAuthenticated: false,
      isProfileCompleted: false,
      isHydrating: false,
    };
    emitChange();
  },
};

export function useAuthStore() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
