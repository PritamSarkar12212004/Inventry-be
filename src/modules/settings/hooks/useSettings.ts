import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import type { UpdateBusinessSettingPayload } from '../types';

export const SETTINGS_QUERY_KEY = ['settings', 'business'] as const;

export function useBusinessSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await settingsApi.getBusinessSettings();
      return res.data;
    },
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBusinessSettingPayload) =>
      settingsApi.updateBusinessSettings(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, res.data);
    },
  });
}

export function useUploadPaymentQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      qrUri,
      type = 'GST',
    }: {
      qrUri: string;
      type?: 'GST' | 'NON_GST';
    }) => settingsApi.uploadPaymentQr(qrUri, type),
    onSuccess: (res) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, res.data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'business'] });
    },
  });
}

export function useUploadStamp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stampUri: string) => settingsApi.uploadStamp(stampUri),
    onSuccess: (res) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, res.data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'business'] });
    },
  });
}
