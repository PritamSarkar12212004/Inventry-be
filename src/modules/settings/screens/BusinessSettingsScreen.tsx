import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { useBusinessSettings, useUpdateBusinessSettings } from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

export function BusinessSettingsScreen() {
  const { data: settings, isLoading } = useBusinessSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateBusinessSettings();

  const [businessName, setBusinessName] = useState('');
  const [proprietorName, setProprietorName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [invoiceFooter, setInvoiceFooter] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.businessName || '');
    setProprietorName(settings.proprietorName || '');
    setAddress(settings.address || '');
    setPhone(settings.phone || '');
    setEmail(settings.email || '');
    setGstin(settings.gstin || '');
    setPan(settings.pan || '');
    setState(settings.state || 'Maharashtra');
    setInvoiceFooter(settings.invoiceFooter || '');

    const bank = settings.bankDetails || {};
    setBankName(bank.bankName || '');
    setAccountType(bank.accountType || '');
    setAccountHolderName(bank.accountHolderName || '');
    setAccountNumber(bank.accountNumber || '');
    setIfscCode(bank.ifscCode || '');
    setBranch(bank.branch || '');
  }, [settings]);

  const handleSave = () => {
    if (!businessName.trim()) {
      popup.error('Required', 'Company / Business name is required.');
      return;
    }

    updateSettings(
      {
        businessName: businessName.trim(),
        proprietorName: proprietorName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        gstin: gstin.trim().toUpperCase() || null,
        pan: pan.trim().toUpperCase() || null,
        state: state.trim(),
        invoiceFooter: invoiceFooter.trim(),
        bankDetails: {
          bankName: bankName.trim(),
          accountType: accountType.trim(),
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          branch: branch.trim(),
        },
      },
      {
        onSuccess: () => {
          popup.success(
            'Saved',
            'Company & invoice details updated successfully.',
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Update Failed',
            axiosErr.response?.data?.message || 'Unable to save settings.',
          );
        },
      },
    );
  };

  if (isLoading && !settings) {
    return <BusinessSettingsSkeleton />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Company / Admin Info</Text>

          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. WISHBOX PAPER DECOR COMPANY"
            placeholderTextColor={colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.label}>Proprietor / Subtitle</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. SWAPAN SUSHIL SINGHA (PROPRIETORSHIP)"
            placeholderTextColor={colors.textMuted}
            value={proprietorName}
            onChangeText={setProprietorName}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Full business address..."
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="9405561572"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Maharashtra"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="wishboxpune@gmail.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>GSTIN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="27DGYPS7370L1Z4"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={gstin}
                onChangeText={setGstin}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>PAN</Text>
              <TextInput
                style={styles.input}
                placeholder="DGYPS7370L"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={pan}
                onChangeText={setPan}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, styles.sectionGap]}>
            Bank Account Details (For PDF)
          </Text>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Axis Bank"
                placeholderTextColor={colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Account Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Saving Account"
                placeholderTextColor={colors.textMuted}
                value={accountType}
                onChangeText={setAccountType}
              />
            </View>
          </View>

          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Account holder name"
            placeholderTextColor={colors.textMuted}
            value={accountHolderName}
            onChangeText={setAccountHolderName}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="917010036587018"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>IFSC Code</Text>
              <TextInput
                style={styles.input}
                placeholder="UTIB0001494"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={setIfscCode}
              />
            </View>
          </View>

          <Text style={styles.label}>Branch</Text>
          <TextInput
            style={styles.input}
            placeholder="Nigdi, Pune"
            placeholderTextColor={colors.textMuted}
            value={branch}
            onChangeText={setBranch}
          />

          <Text style={styles.label}>PDF Footer Note</Text>
          <TextInput
            style={styles.input}
            placeholder="Thank you for doing business with WishBox!"
            placeholderTextColor={colors.textMuted}
            value={invoiceFooter}
            onChangeText={setInvoiceFooter}
          />

          <View style={styles.saveBtnWrap}>
            <AuthButton
              title="Save Company & Bank Info"
              onPress={handleSave}
              loading={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  sectionGap: {
    marginTop: spacing.xl,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  saveBtnWrap: {
    marginTop: spacing.xl,
  },
});
