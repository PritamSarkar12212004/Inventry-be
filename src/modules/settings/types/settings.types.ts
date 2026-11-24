export type BankDetails = {
  bankName?: string;
  accountType?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
};

export type PaymentReminderSettings = {
  enabled?: boolean;
  firstReminderDays?: number;
  repeatEveryDays?: number;
};

export type StockReminderSettings = {
  enabled?: boolean;
  lowStockThreshold?: number;
  repeatEveryDays?: number;
};

export type BusinessSettingData = {
  _id?: string;
  businessName: string;
  proprietorName?: string;
  logoUrl?: string | null;
  stampUrl?: string | null;
  paymentQrUrl?: string | null;
  upiId?: string | null;
  nonGstPaymentQrUrl?: string | null;
  nonGstUpiId?: string | null;
  address?: string;
  phone?: string;
  email?: string | null;
  gstin?: string | null;
  pan?: string | null;
  state?: string;
  stateCode?: string;
  invoiceFooter?: string;
  termsAndConditions?: string;
  bankDetails?: BankDetails;
  paymentReminderSettings?: PaymentReminderSettings;
  stockReminderSettings?: StockReminderSettings;
};

export type UpdateBusinessSettingPayload = Partial<
  Omit<BusinessSettingData, '_id'>
>;
