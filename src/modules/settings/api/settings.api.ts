import { apiGet, apiPatch } from '../../../core/api';
import type {
  BusinessSettingData,
  UpdateBusinessSettingPayload,
} from '../types';

export const settingsApi = {
  getBusinessSettings: () =>
    apiGet<{ success: boolean; data: BusinessSettingData }>('/settings'),

  updateBusinessSettings: (payload: UpdateBusinessSettingPayload) =>
    apiPatch<
      { success: boolean; data: BusinessSettingData },
      UpdateBusinessSettingPayload
    >('/settings', payload),
};
