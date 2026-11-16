import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { secureStorage } from '../../../core/storage/secureStorage';
import { authStore, useAuthStore } from '../../../core/store/authStore';
import { authApi } from '../api';
import { authLogger } from '../logs';
import type { SendOtpPayload, VerifyOtpPayload } from '../types';

export const AUTH_QUERY_KEYS = {
  me: ['auth', 'me'] as const,
};

export function useSendOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authApi.sendOtp(payload),
    onSuccess: (res) => {
      authLogger.info('sendOtp:success', res);
    },
    onError: (err) => {
      authLogger.error('sendOtp:error', err);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authApi.resendOtp(payload),
    onSuccess: (res) => {
      authLogger.info('resendOtp:success', res);
    },
    onError: (err) => {
      authLogger.error('resendOtp:error', err);
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authApi.verifyOtp(payload),
    onSuccess: async (res) => {
      authLogger.info('verifyOtp:success', res);
      await secureStorage.saveTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, res.data.user);
      authStore.login();
    },
    onError: (err) => {
      authLogger.error('verifyOtp:error', err);
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me,
    queryFn: async () => {
      const res = await authApi.getMe();
      authLogger.info('getMe:success', res);
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      authLogger.info('logout:complete');
      await secureStorage.clearTokens();
      queryClient.clear();
      authStore.logout();
    },
  });
}
