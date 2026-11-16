import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import { authStore } from '../store/authStore';

// Android Emulator uses 10.0.2.2 to reach host localhost; iOS Simulator uses localhost
export const API_ORIGIN =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const DEV_BASE_URL = `${API_ORIGIN}/api/v1`;

export const apiClient = axios.create({
  baseURL: DEV_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  const tokens = await secureStorage.getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await secureStorage.getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const res = await axios.post(`${DEV_BASE_URL}/auth/refresh`, {
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
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

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
