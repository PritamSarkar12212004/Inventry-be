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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import { authStore } from '../../../core/store/authStore';
import {
  AdminPhoneForm,
  AuthButton,
  AuthHeroHeader,
  EmployeeLoginForm,
  RoleSwitchButton,
} from '../components';
import { AUTH_COPY } from '../data';
import { authStyles } from '../styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;
type LoginRole = 'admin' | 'employee';

export function PhoneLoginScreen({ navigation }: Props) {
  const [role, setRole] = useState<LoginRole>('admin');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isPhoneValid = phone.trim().length === 10;
  const isEmployeeValid = userId.trim().length >= 3 && password.length >= 6;
  const canSubmit = role === 'admin' ? isPhoneValid : isEmployeeValid;
  const activeCopy = role === 'admin' ? AUTH_COPY.admin : AUTH_COPY.employee;

  const handleContinue = () => {
    if (isLoading) return;

    if (role === 'admin') {
      if (!isPhoneValid) return;
      setIsLoading(true);
      timerRef.current = setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('OtpVerify', { phone: phone.trim() });
      }, 1500);
    } else {
      if (!isEmployeeValid) return;
      setIsLoading(true);
      timerRef.current = setTimeout(() => {
        setIsLoading(false);
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
              <AdminPhoneForm phone={phone} onChangePhone={setPhone} />
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
              onPress={() =>
                setRole(prev => (prev === 'admin' ? 'employee' : 'admin'))
              }
            />

            <Text style={authStyles.footerText}>{AUTH_COPY.footerNote}</Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
