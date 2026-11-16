import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, LogOut, Mail, Phone } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_ORIGIN } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
  touchTarget,
} from '../../../core/theme';
import { AuthButton, AuthInput, CompanyLogoPicker } from '../components';
import { AUTH_COPY } from '../data';
import {
  useBusinessSettings,
  useLogout,
  useMe,
  useSaveProfile,
} from '../hooks';
import type { ApiResponse } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { data: user, isLoading: isLoadingMe } = useMe();
  const { data: business, isLoading: isLoadingBusiness } = useBusinessSettings();
  const { mutate: saveProfile, isPending: isSaving } = useSaveProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [hasPickedLogo, setHasPickedLogo] = useState(false);

  useEffect(() => {
    setCompanyName((prev) => prev || business?.businessName || user?.name || '');
    setEmail((prev) => prev || business?.email || user?.email || '');
    if (!hasPickedLogo && business?.logoUrl) {
      const fullUrl = business.logoUrl.startsWith('http')
        ? business.logoUrl
        : `${API_ORIGIN}${business.logoUrl}`;
      setLogoUri(fullUrl);
    }
  }, [user, business, hasPickedLogo]);

  const isLoadingInitial = isLoadingMe || isLoadingBusiness;
  const isBusy = isSaving || isLoggingOut;
  const canSave = companyName.trim().length >= 2;

  const handleSelectLogo = (uri: string) => {
    setHasPickedLogo(true);
    setLogoUri(uri);
  };

  const handleSaveAndContinue = () => {
    if (isBusy) return;
    if (!canSave) {
      popup.error('Invalid Input', 'Please enter a valid company name.');
      return;
    }

    saveProfile(
      {
        companyName: companyName.trim(),
        email: email.trim() || undefined,
        localLogoUri: hasPickedLogo ? logoUri : null,
      },
      {
        onSuccess: () => {
          navigation.replace('Main');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          popup.error(
            'Save Failed',
            axiosErr.response?.data?.message || 'Could not save profile.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoadingInitial ? (
          <View style={styles.loaderBox}>
            <IosLoader size={28} color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CompanyLogoPicker
              logoUri={logoUri}
              hint={AUTH_COPY.profile.logoHint}
              onSelectLogo={handleSelectLogo}
            />

            <View style={styles.formArea}>
              <AuthInput
                label={AUTH_COPY.profile.companyNameLabel}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder={AUTH_COPY.profile.companyNamePlaceholder}
                leftIcon={<Building2 size={18} color={colors.textMuted} />}
              />

              <AuthInput
                label={AUTH_COPY.profile.emailLabel}
                value={email}
                onChangeText={setEmail}
                placeholder={AUTH_COPY.profile.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={colors.textMuted} />}
              />

              <AuthInput
                label={AUTH_COPY.profile.phoneLabel}
                value={user?.phone ? `+91 ${user.phone}` : '—'}
                editable={false}
                leftIcon={<Phone size={18} color={colors.textMuted} />}
              />
            </View>

            <View style={styles.bottomActions}>
              <AuthButton
                title={AUTH_COPY.profile.saveLabel}
                onPress={handleSaveAndContinue}
                disabled={!canSave || isLoggingOut}
                loading={isSaving}
              />

              <TouchableOpacity
                style={[styles.logoutBtn, isBusy && styles.disabled]}
                onPress={() => logout()}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <IosLoader size={18} color={colors.danger} />
                ) : (
                  <>
                    <LogOut size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>
                      {AUTH_COPY.profile.logoutLabel}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  formArea: {
    flex: 1,
  },
  bottomActions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  logoutBtn: {
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
});
