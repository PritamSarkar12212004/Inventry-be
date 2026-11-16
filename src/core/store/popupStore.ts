import { useSyncExternalStore } from 'react';

export type PopupType = 'success' | 'error' | 'info';

export type PopupState = {
  visible: boolean;
  type: PopupType;
  title: string;
  message: string;
  confirmText: string;
};

let state: PopupState = {
  visible: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'OK',
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function show(
  type: PopupType,
  title: string,
  message: string,
  confirmText = 'OK',
) {
  state = { visible: true, type, title, message, confirmText };
  emitChange();
}

export const popup = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  success: (title: string, message: string, confirmText = 'OK') =>
    show('success', title, message, confirmText),
  error: (title: string, message: string, confirmText = 'OK') =>
    show('error', title, message, confirmText),
  info: (title: string, message: string, confirmText = 'OK') =>
    show('info', title, message, confirmText),
  hide: () => {
    state = { ...state, visible: false };
    emitChange();
  },
};

export function usePopupStore() {
  return useSyncExternalStore(popup.subscribe, popup.getSnapshot);
}
