import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronRight, UploadCloud, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { AxiosError } from 'axios';
import { getApiOrigin } from '../../../core/api';
import { popup } from '../../../core/store/popupStore';
import { compressImageUri } from '../../../core/util/imageCompressor';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import {
  useBusinessSettings,
  useUpdateBusinessSettings,
  useUploadStamp,
} from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

function resolveMediaUrl(raw?: string | null): string | null {
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${getApiOrigin()}${raw}`;
}

const ACCOUNT_TYPE_OPTIONS = [
  {
    value: 'Saving Account',
    subtitle: 'Personal or sole-proprietor savings bank account',
  },
  {
    value: 'Current Account',
    subtitle: 'Standard business & high-volume transaction account',
  },
  {
    value: 'Overdraft (OD) Account',
    subtitle: 'Credit-backed account against deposits or collateral',
  },
  {
    value: 'Cash Credit (CC) Account',
    subtitle: 'Working capital facility against inventory or receivables',
  },
  {
    value: 'Salary Account',
    subtitle: 'Zero-balance payroll bank account',
  },
  {
    value: 'Business Account',
    subtitle: 'Dedicated commercial or MSME banking account',
  },
] as const;

export function BusinessSettingsScreen() {
  const { data: settings, isLoading } = useBusinessSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateBusinessSettings();
  const { mutateAsync: uploadStamp, isPending: isUploadingStamp } =
    useUploadStamp();

  const [stampUri, setStampUri] = useState<string | null>(null);

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
  const [accountTypeModalOpen, setAccountTypeModalOpen] = useState(false);
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
    setStampUri(resolveMediaUrl(settings.stampUrl));
  }, [settings]);

  const handlePickAndUploadStamp = async () => {
    if (isUploadingStamp) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 1000,
      maxHeight: 1000,
      selectionLimit: 1,
    });
    const picked = result.assets?.[0]?.uri;
    if (!picked) return;

    try {
      const compressed = await compressImageUri(picked);
      setStampUri(compressed);
      const res = await uploadStamp(compressed);
      setStampUri(resolveMediaUrl(res?.data?.stampUrl) ?? compressed);
      popup.success('Updated', 'Stamp / signature uploaded for invoice PDFs.');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>;
      setStampUri(resolveMediaUrl(settings?.stampUrl));
      popup.error(
        'Upload Failed',
        axiosErr.response?.data?.message || 'Unable to upload stamp image.',
      );
    }
  };

  const handleSave = () => {
    const requiredFields: Array<[string, string]> = [
      [businessName, 'Company Name'],
      [address, 'Address'],
      [phone, 'Contact Phone'],
      [state, 'State'],
      [email, 'Email'],
      [pan, 'PAN'],
      [bankName, 'Bank Name'],
      [accountType, 'Account Type'],
      [accountHolderName, 'Account Holder Name'],
      [accountNumber, 'Account Number'],
      [ifscCode, 'IFSC Code'],
      [branch, 'Branch'],
      [invoiceFooter, 'PDF Footer Note'],
    ];

    const missing = requiredFields.find(([val]) => !val.trim());
    if (missing) {
      popup.error('Required', `${missing[1]} is required.`);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      popup.error('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!stampUri && !settings?.stampUrl) {
      popup.error('Required', 'Please upload a company stamp or signature.');
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
            placeholder="Enter company name"
            placeholderTextColor={colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.label}>Proprietor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter proprietor name"
            placeholderTextColor={colors.textMuted}
            value={proprietorName}
            onChangeText={setProprietorName}
          />

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Enter full business address"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter business email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>GST Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 15-digit GSTIN"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={gstin}
                onChangeText={setGstin}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>PAN *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-character PAN"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={pan}
                onChangeText={setPan}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, styles.sectionGap]}>
            Bank Details
          </Text>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Bank Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                placeholderTextColor={colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Account Type *</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.75}
                onPress={() => setAccountTypeModalOpen(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !accountType && styles.dropdownPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {accountType || 'Select type'}
                </Text>
                <ChevronDown size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Account Holder Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account holder name"
            placeholderTextColor={colors.textMuted}
            value={accountHolderName}
            onChangeText={setAccountHolderName}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter IFSC code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={setIfscCode}
              />
            </View>
          </View>

          <Text style={styles.label}>Branch *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter branch name"
            placeholderTextColor={colors.textMuted}
            value={branch}
            onChangeText={setBranch}
          />

          <Text style={styles.label}>PDF Footer Note *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter invoice footer note"
            placeholderTextColor={colors.textMuted}
            value={invoiceFooter}
            onChangeText={setInvoiceFooter}
          />

          <Text style={[styles.sectionTitle, styles.sectionGap]}>
            Stamp / Signature *
          </Text>
          <TouchableOpacity
            style={styles.stampCard}
            activeOpacity={0.78}
            onPress={handlePickAndUploadStamp}
            disabled={isUploadingStamp}
          >
            <View
              style={[
                styles.stampPreviewBox,
                !stampUri && styles.stampPreviewEmpty,
              ]}
            >
              {isUploadingStamp ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : stampUri ? (
                <Image
                  source={{ uri: stampUri }}
                  style={styles.stampImage}
                  resizeMode="contain"
                />
              ) : (
                <UploadCloud size={24} color={colors.primary} />
              )}
            </View>
            <View style={styles.stampInfo}>
              <View style={styles.stampTitleRow}>
                <Text style={styles.stampTitle}>
                  {stampUri ? 'Stamp / Signature' : 'Upload Stamp / Signature'}
                </Text>
                {stampUri ? (
                  <View style={[styles.stampBadge, styles.stampBadgeActive]}>
                    <Text
                      style={[styles.stampBadgeText, styles.stampBadgeTextActive]}
                    >
                      Active
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.stampSub}>
                {isUploadingStamp
                  ? 'Uploading...'
                  : stampUri
                    ? 'Tap anywhere here to replace'
                    : 'Tap anywhere here to select from gallery'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.saveBtnWrap}>
            <AuthButton
              title="Save Company & Bank Info"
              onPress={handleSave}
              loading={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={accountTypeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountTypeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTap}
            onPress={() => setAccountTypeModalOpen(false)}
          />
          <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Select Account Type</Text>
                <Text style={styles.modalSub}>
                  Choose the bank account type shown on your invoices
                </Text>
              </View>
              <View style={styles.modalActions}>
                {accountType ? (
                  <TouchableOpacity
                    style={styles.modalClearPill}
                    activeOpacity={0.75}
                    onPress={() => {
                      setAccountType('');
                      setAccountTypeModalOpen(false);
                    }}
                  >
                    <Text style={styles.modalClear}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  activeOpacity={0.75}
                  onPress={() => setAccountTypeModalOpen(false)}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {ACCOUNT_TYPE_OPTIONS.map((option) => {
                const isSelected = accountType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionActive,
                    ]}
                    activeOpacity={0.78}
                    onPress={() => {
                      setAccountType(option.value);
                      setAccountTypeModalOpen(false);
                    }}
                  >
                    <View style={styles.modalOptionTextWrap}>
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextActive,
                        ]}
                      >
                        {option.value}
                      </Text>
                      <Text style={styles.modalOptionSub}>
                        {option.subtitle}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleActive,
                      ]}
                    >
                      {isSelected ? (
                        <Check size={14} color={colors.surface} />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
  stampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
  },
  stampPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stampPreviewEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  stampImage: {
    width: 60,
    height: 60,
  },
  stampInfo: {
    flex: 1,
    gap: 4,
  },
  stampTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stampTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  stampBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  stampBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  stampBadgeIdle: {
    backgroundColor: '#FEE2E2',
  },
  stampBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  stampBadgeTextActive: {
    color: '#15803D',
  },
  stampBadgeTextIdle: {
    color: '#DC2626',
  },
  stampSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTap: {
    height: '8%',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalClearPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  modalClear: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    gap: spacing.md,
  },
  modalOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  modalOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  modalOptionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalOptionTextActive: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  modalOptionSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
