import React, { useEffect, useRef, useState } from 'react';
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
import { authStore } from '../../../core/store/authStore';
import { popup } from '../../../core/store/popupStore';
import {
  AdminPhoneForm,
  AuthButton,
  AuthHeroHeader,
  EmployeeLoginForm,
  RoleSwitchButton,
} from '../components';
import { AUTH_COPY } from '../data';
import { useSendOtp } from '../hooks';
import { authStyles } from '../styles';
import type { ApiResponse } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;
type LoginRole = 'admin' | 'employee';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function PhoneLoginScreen({ navigation }: Props) {
  const [role, setRole] = useState<LoginRole>('admin');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isPhoneValid = INDIAN_PHONE_REGEX.test(phone.trim());
  const isEmployeeValid = userId.trim().length >= 3 && password.length >= 6;
  const canSubmit = role === 'admin' ? isPhoneValid : isEmployeeValid;
  const isLoading = role === 'admin' ? isSendingOtp : employeeLoading;
  const activeCopy = role === 'admin' ? AUTH_COPY.admin : AUTH_COPY.employee;

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleContinue = () => {
    if (isLoading) return;

    if (role === 'admin') {
      const cleaned = phone.trim();
      if (!INDIAN_PHONE_REGEX.test(cleaned)) {
        popup.error('Invalid Number', AUTH_COPY.errors.invalidPhone);
        return;
      }

      sendOtp(
        { phone: cleaned },
        {
          onSuccess: () => {
            navigation.navigate('OtpVerify', { phone: cleaned });
          },
          onError: err => {
            const axiosErr = err as AxiosError<ApiResponse<null>>;
            const msg =
              axiosErr.response?.data?.message ||
              AUTH_COPY.errors.sendOtpFailed;
            popup.error('OTP Request Failed', msg);
          },
        },
      );
    } else {
      if (!isEmployeeValid) return;
      setEmployeeLoading(true);
      timerRef.current = setTimeout(() => {
        setEmployeeLoading(false);
        authStore.login();
      }, 1500);
    }
  };

  return (
    <View style={authStyles.root}>
      <StatusBar barStyle="dark-content" />

      <AuthHeroHeader
        title={activeCopy.heroTitle}
        subtitle={activeCopy.heroSubtitle}
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
            {role === 'admin' ? (
              <AdminPhoneForm phone={phone} onChangePhone={handlePhoneChange} />
            ) : (
              <EmployeeLoginForm
                userId={userId}
                password={password}
                onChangeUserId={setUserId}
                onChangePassword={setPassword}
              />
            )}
          </View>

          <SafeAreaView edges={['bottom']} style={authStyles.bottomArea}>
            <AuthButton
              title={activeCopy.submitLabel}
              onPress={handleContinue}
              disabled={!canSubmit}
              loading={isLoading}
            />

            <View style={authStyles.dividerRow}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>{AUTH_COPY.orDivider}</Text>
              <View style={authStyles.dividerLine} />
            </View>

            <RoleSwitchButton
              role={role}
              disabled={isLoading}
              onPress={() => {
                setRole(prev => (prev === 'admin' ? 'employee' : 'admin'));
              }}
            />

            <Text style={authStyles.footerText}>{AUTH_COPY.footerNote}</Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
