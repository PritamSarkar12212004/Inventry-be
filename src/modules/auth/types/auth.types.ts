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
  _id: string;
  phone: string;
  name?: string;
  role?: string;
};

export type VerifyOtpData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
