export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type SendOtpPayload = {
  phone: string;
};

export type VerifyOtpPayload = {
  phone: string;
  otp: string;
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export type VerifyOtpData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type UpdateProfilePayload = {
  name: string;
  email: string;
};

export type BusinessSettingsData = {
  businessName: string;
  email?: string | null;
  logoUrl?: string | null;
};

export type UpdateBusinessPayload = {
  businessName: string;
  email: string;
};
