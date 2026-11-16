import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import {
  colors,
  commonStyles,
  fontSize,
  fontWeight,
  radius,
  spacing,
  touchTarget,
} from '../../../core/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');

  const handleVerifyOtp = () => {
    if (otp.trim().length !== 6) {
      return;
    }
    // TODO: Connect POST /api/v1/auth/verify-otp
  };

  return (
    <SafeAreaView style={commonStyles.screen} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            6-digit OTP bheja gaya hai: {phone}
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={[
              commonStyles.primaryButton,
              otp.trim().length !== 6 && styles.disabledBtn,
            ]}
            onPress={handleVerifyOtp}
            disabled={otp.trim().length !== 6}
          >
            <Text style={commonStyles.primaryButtonText}>Verify & Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    letterSpacing: 6,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    marginBottom: spacing.lg,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
