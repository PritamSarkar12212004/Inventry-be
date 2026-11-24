import { apiGet, apiPatch, apiPost } from '../../../core/api';
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

  uploadPaymentQr: (qrUri: string, type: 'GST' | 'NON_GST' = 'GST') => {
    const formData = new FormData();
    const filename = qrUri.split('/').pop() || 'payment-qr.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('type', type);
    formData.append('qr', {
      uri: qrUri,
      name: filename,
      type: mime,
    } as unknown as Blob);

    return apiPost<{ success: boolean; data: BusinessSettingData }, FormData>(
      '/settings/payment-qr',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  uploadStamp: (stampUri: string) => {
    const formData = new FormData();
    const filename = stampUri.split('/').pop() || 'company-stamp.png';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('stamp', {
      uri: stampUri,
      name: filename,
      type: mime,
    } as unknown as Blob);

    return apiPost<{ success: boolean; data: BusinessSettingData }, FormData>(
      '/settings/stamp',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },
};
