import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import { popup } from '../../../core/store/popupStore';
import {
  AdminPhoneForm,
  AuthButton,
  AuthHeroHeader,
} from '../components';
import { AUTH_COPY } from '../data';
import { useSendOtp } from '../hooks';
import { authStyles } from '../styles';
import type { ApiResponse } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function PhoneLoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const isPhoneValid = INDIAN_PHONE_REGEX.test(phone.trim());

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleContinue = () => {
    if (isSendingOtp) return;

    const cleaned = phone.trim();
    if (!INDIAN_PHONE_REGEX.test(cleaned)) {
      popup.error('Invalid Number', AUTH_COPY.errors.invalidPhone);
      return;
    }

    sendOtp(
      { phone: cleaned },
      {
        onSuccess: res => {
          const devOtp = res?.data?.devOtp;
          if (devOtp) {
            popup.info('Dev OTP (Gateway Offline)', `Use OTP: ${devOtp}`);
          }
          navigation.navigate('OtpVerify', { phone: cleaned });
        },
        onError: err => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          const rawMsg = axiosErr.response?.data?.message;
          const msg =
            typeof rawMsg === 'string' && rawMsg.trim()
              ? rawMsg
              : AUTH_COPY.errors.sendOtpFailed;
          popup.error('OTP Request Failed', msg);
        },
      },
    );
  };

  return (
    <View style={authStyles.root}>
      <StatusBar barStyle="dark-content" />

      <AuthHeroHeader
        title={AUTH_COPY.admin.heroTitle}
        subtitle={AUTH_COPY.admin.heroSubtitle}
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
            <AdminPhoneForm phone={phone} onChangePhone={handlePhoneChange} />
          </View>

          <SafeAreaView edges={['bottom']} style={authStyles.bottomArea}>
            <AuthButton
              title={AUTH_COPY.admin.submitLabel}
              onPress={handleContinue}
              disabled={!isPhoneValid}
              loading={isSendingOtp}
            />

            <Text style={authStyles.footerText}>{AUTH_COPY.footerNote}</Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
