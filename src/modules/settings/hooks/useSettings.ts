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
