import { apiGet, apiPost } from '../../../core/api';
import { AUTH_PATHS } from '../constants';
import type {
  ApiResponse,
  AuthUser,
  SendOtpPayload,
  VerifyOtpData,
  VerifyOtpPayload,
} from '../types';

export const authApi = {
  sendOtp: (payload: SendOtpPayload) =>
    apiPost<ApiResponse<null>, SendOtpPayload>(AUTH_PATHS.sendOtp, payload),

  resendOtp: (payload: SendOtpPayload) =>
    apiPost<ApiResponse<null>, SendOtpPayload>(AUTH_PATHS.resendOtp, payload),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiPost<ApiResponse<VerifyOtpData>, VerifyOtpPayload>(
      AUTH_PATHS.verifyOtp,
      payload,
    ),

  logout: () => apiPost<ApiResponse<null>>(AUTH_PATHS.logout),

  getMe: () => apiGet<ApiResponse<AuthUser>>(AUTH_PATHS.me),
};
