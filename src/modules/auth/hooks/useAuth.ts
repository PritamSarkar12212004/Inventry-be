import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { secureStorage } from '../../../core/storage/secureStorage';
import { authStore, useAuthStore } from '../../../core/store/authStore';
import { authApi } from '../api';
import { authLogger } from '../logs';
import type { SendOtpPayload, VerifyOtpPayload } from '../types';

export const AUTH_QUERY_KEYS = {
  me: ['auth', 'me'] as const,
  businessSettings: ['auth', 'businessSettings'] as const,
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

export function useBusinessSettings() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.businessSettings,
    queryFn: async () => {
      const res = await authApi.getBusinessSettings();
      authLogger.info('getBusinessSettings:success', res);
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export type SaveProfileInput = {
  companyName: string;
  email: string;
  localLogoUri?: string | null;
};

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyName, email, localLogoUri }: SaveProfileInput) => {
      const [profileRes, settingsRes] = await Promise.all([
        authApi.updateProfile({ name: companyName, email }),
        authApi.updateBusinessSettings({ businessName: companyName, email }),
      ]);

      let latestSettings = settingsRes.data;
      if (localLogoUri && !localLogoUri.startsWith('http')) {
        const logoRes = await authApi.uploadBusinessLogo(localLogoUri);
        latestSettings = logoRes.data;
      }

      return { user: profileRes.data, settings: latestSettings };
    },
    onSuccess: (data) => {
      authLogger.info('saveProfile:success', data);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.businessSettings, data.settings);
    },
    onError: (err) => {
      authLogger.error('saveProfile:error', err);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      authLogger.info('logout:complete');
      await Promise.all([
        secureStorage.clearTokens(),
        secureStorage.setProfileCompleted(false),
      ]);
      queryClient.clear();
      authStore.logout();
    },
  });
}
