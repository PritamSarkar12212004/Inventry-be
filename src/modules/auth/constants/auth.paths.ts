export const AUTH_PATHS = {
  sendOtp: '/auth/send-otp',
  resendOtp: '/auth/resend-otp',
  verifyOtp: '/auth/verify-otp',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  profile: '/auth/profile',
  businessSettings: '/settings',
  businessLogo: '/settings/logo',
} as const;
