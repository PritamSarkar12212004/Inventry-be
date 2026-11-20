import { apiGet, apiPatch, apiPost } from '../../../core/api';
import { AUTH_PATHS } from '../constants';
import type {
  ApiResponse,
  AuthUser,
  BusinessSettingsData,
  SendOtpPayload,
  UpdateBusinessPayload,
  UpdateProfilePayload,
  VerifyOtpData,
  VerifyOtpPayload,
} from '../types';

export const authApi = {
  sendOtp: (payload: SendOtpPayload) =>
    apiPost<ApiResponse<null>, SendOtpPayload>(
      AUTH_PATHS.sendOtp,
      payload,
    ),

  resendOtp: (payload: SendOtpPayload) =>
    apiPost<ApiResponse<null>, SendOtpPayload>(
      AUTH_PATHS.resendOtp,
      payload,
    ),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiPost<ApiResponse<VerifyOtpData>, VerifyOtpPayload>(
      AUTH_PATHS.verifyOtp,
      payload,
    ),

  logout: () => apiPost<ApiResponse<null>>(AUTH_PATHS.logout),

  getMe: () => apiGet<ApiResponse<AuthUser>>(AUTH_PATHS.me),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiPatch<ApiResponse<AuthUser>, UpdateProfilePayload>(
      AUTH_PATHS.profile,
      payload,
    ),

  getBusinessSettings: () =>
    apiGet<ApiResponse<BusinessSettingsData>>(AUTH_PATHS.businessSettings),

  updateBusinessSettings: (payload: UpdateBusinessPayload) =>
    apiPatch<ApiResponse<BusinessSettingsData>, UpdateBusinessPayload>(
      AUTH_PATHS.businessSettings,
      payload,
    ),

  uploadBusinessLogo: (logoUri: string) => {
    const formData = new FormData();
    const filename = logoUri.split('/').pop() || 'logo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('logo', {
      uri: logoUri,
      name: filename,
      type: mime,
    } as unknown as Blob);

    return apiPost<ApiResponse<BusinessSettingsData>, FormData>(
      AUTH_PATHS.businessLogo,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
  },
};
