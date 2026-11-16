import React, { useEffect, useRef, useState } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import { authStore } from '../../../core/store/authStore';
import { colors } from '../../../core/theme';
import { AuthButton, AuthHeroHeader, OtpCodeInput } from '../components';
import { AUTH_COPY } from '../data';
import { authStyles } from '../styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const RESEND_SECONDS = 30;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = () => {
    if (isLoading || otp.length !== 6) return;
    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      setIsLoading(false);
      authStore.login();
    }, 1500);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
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
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
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
              disabled={otp.length !== 6}
              loading={isLoading}
            />

            <TouchableOpacity
              style={[authStyles.backBtn, isLoading && { opacity: 0.5 }]}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
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
