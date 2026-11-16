import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './client';

export async function apiGet<TResponse>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await apiClient.get<TResponse>(url, { ...config, params });
  return data;
}

export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await apiClient.post<TResponse>(url, body, config);
  return data;
}

export async function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await apiClient.patch<TResponse>(url, body, config);
  return data;
}

export async function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await apiClient.delete<TResponse>(url, config);
  return data;
}
