import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import { popup } from '../../../core/store/popupStore';
import { colors } from '../../../core/theme';
import { AuthButton, AuthHeroHeader, OtpCodeInput } from '../components';
import { AUTH_COPY } from '../data';
import { useResendOtp, useVerifyOtp } from '../hooks';
import { authStyles } from '../styles';
import type { ApiResponse } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const RESEND_SECONDS = 30;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();
  const isBusy = isVerifying || isResending;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = () => {
    if (isBusy || otp.length !== 6) return;

    verifyOtp(
      { phone, otp },
      {
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          popup.error(
            'Verification Failed',
            axiosErr.response?.data?.message ||
              AUTH_COPY.errors.verifyOtpFailed,
          );
        },
      },
    );
  };

  const handleResend = () => {
    if (secondsLeft > 0 || isBusy) return;

    resendOtp(
      { phone },
      {
        onSuccess: () => {
          setSecondsLeft(RESEND_SECONDS);
          popup.success(
            'OTP Sent',
            `A new 6-digit code has been sent to +91 ${phone}.`,
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          popup.error(
            'Resend Failed',
            axiosErr.response?.data?.message || AUTH_COPY.errors.sendOtpFailed,
          );
        },
      },
    );
  };

  return (
    <View style={authStyles.root}>
      <StatusBar barStyle="dark-content" />

      <AuthHeroHeader
        title={AUTH_COPY.otpVerify.heroTitle}
        subtitle={`${AUTH_COPY.otpVerify.heroSubtitlePrefix}${phone}`}
      />

      <KeyboardAvoidingView
        style={authStyles.sheetWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={authStyles.sheetScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.formArea}>
            <Text style={authStyles.label}>{AUTH_COPY.otpVerify.codeLabel}</Text>
            <OtpCodeInput code={otp} onChangeCode={setOtp} />

            <View style={authStyles.resendRow}>
              {secondsLeft > 0 ? (
                <Text style={authStyles.resendTimerText}>
                  {`${AUTH_COPY.otpVerify.resendPrefix}${secondsLeft}s`}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <Text style={authStyles.resendActionText}>
                    {AUTH_COPY.otpVerify.resendAction}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <SafeAreaView edges={['bottom']} style={authStyles.bottomArea}>
            <AuthButton
              title={AUTH_COPY.otpVerify.verifyLabel}
              onPress={handleVerify}
              disabled={otp.length !== 6 || isResending}
              loading={isVerifying}
            />

            <TouchableOpacity
              style={[authStyles.backBtn, isBusy && authStyles.disabled]}
              onPress={() => navigation.goBack()}
              disabled={isBusy}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={authStyles.backBtnText}>
                {AUTH_COPY.otpVerify.changeNumberLabel}
              </Text>
            </TouchableOpacity>

            <Text style={authStyles.footerText}>{AUTH_COPY.footerNote}</Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
