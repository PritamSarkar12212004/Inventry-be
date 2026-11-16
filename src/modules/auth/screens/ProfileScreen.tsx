import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, LogOut, Mail, Phone } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { API_ORIGIN } from '../../../core/api';
import { IosLoader } from '../../../core/components/IosLoader';
import { authStore } from '../../../core/store/authStore';
import { popup } from '../../../core/store/popupStore';
import { colors } from '../../../core/theme';
import {
  AuthButton,
  AuthInput,
  CompanyLogoPicker,
  ProfileHeader,
} from '../components';
import { AUTH_COPY } from '../data';
import {
  useBusinessSettings,
  useLogout,
  useMe,
  useSaveProfile,
} from '../hooks';
import { profileStyles } from '../styles';
import type { ApiResponse } from '../types';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function ProfileScreen() {
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
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const canSave = companyName.trim().length >= 2 && isEmailValid;

  const handleSelectLogo = (uri: string) => {
    setHasPickedLogo(true);
    setLogoUri(uri);
  };

  const handleSaveAndContinue = () => {
    if (isBusy) return;
    if (!canSave) {
      popup.error(
        'Invalid Input',
        'Please enter a valid company name and email address.',
      );
      return;
    }

    saveProfile(
      {
        companyName: companyName.trim(),
        email: email.trim(),
        localLogoUri: hasPickedLogo ? logoUri : null,
      },
      {
        onSuccess: async () => {
          await authStore.completeProfile();
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
    <SafeAreaView style={profileStyles.root} edges={['bottom']}>
      <ProfileHeader
        title={AUTH_COPY.profile.title}
        subtitle={AUTH_COPY.profile.subtitle}
      />

      <KeyboardAvoidingView
        style={profileStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoadingInitial ? (
          <View style={profileStyles.loaderBox}>
            <IosLoader size={28} color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={profileStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CompanyLogoPicker
              logoUri={logoUri}
              hint={AUTH_COPY.profile.logoHint}
              onSelectLogo={handleSelectLogo}
            />

            <View style={profileStyles.formArea}>
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

            <View style={profileStyles.bottomActions}>
              <AuthButton
                title={AUTH_COPY.profile.saveLabel}
                onPress={handleSaveAndContinue}
                disabled={!canSave || isLoggingOut}
                loading={isSaving}
              />

              <TouchableOpacity
                style={[
                  profileStyles.logoutBtn,
                  isBusy && profileStyles.disabled,
                ]}
                onPress={() => logout()}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <IosLoader size={18} color={colors.danger} />
                ) : (
                  <>
                    <LogOut size={18} color={colors.danger} />
                    <Text style={profileStyles.logoutText}>
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
