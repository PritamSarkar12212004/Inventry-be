import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import { authStore } from '../store/authStore';

// With `adb reverse tcp:3000 tcp:3000`, localhost:3000 works on both Emulator & USB phone.
// If emulator loses adb reverse, we automatically fall back to 10.0.2.2:3000.
export const API_ORIGIN = 'http://localhost:3000';
const EMULATOR_FALLBACK_ORIGIN = 'http://10.0.2.2:3000';

let activeOrigin = API_ORIGIN;

export const getApiOrigin = () => activeOrigin;

export const apiClient = axios.create({
  baseURL: `${activeOrigin}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  config.baseURL = `${activeOrigin}/api/v1`;
  const tokens = await secureStorage.getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _fallbackRetry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await secureStorage.getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const res = await axios.post(`${activeOrigin}/api/v1/auth/refresh`, {
      refreshToken: tokens.refreshToken,
    });
    const newAccessToken: string | undefined = res.data?.data?.accessToken;
    const newRefreshToken: string =
      res.data?.data?.refreshToken ?? tokens.refreshToken;

    if (!newAccessToken) return null;

    await secureStorage.saveTokens({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
    return newAccessToken;
  } catch {
    await secureStorage.clearTokens();
    authStore.logout();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      Platform.OS === 'android' &&
      !error.response &&
      originalRequest &&
      !originalRequest._fallbackRetry
    ) {
      originalRequest._fallbackRetry = true;
      activeOrigin =
        activeOrigin === API_ORIGIN ? EMULATOR_FALLBACK_ORIGIN : API_ORIGIN;
      originalRequest.baseURL = `${activeOrigin}/api/v1`;
      return apiClient(originalRequest);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
