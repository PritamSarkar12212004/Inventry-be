import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Building2,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  QrCode,
  User,
} from 'lucide-react-native';
import { API_ORIGIN } from '../../../core/api';
import { IosConfirmModal } from '../../../core/components/IosConfirmModal';
import type { RootStackParamList } from '../../../core/navigation/types';
import { authStore } from '../../../core/store/authStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { useBusinessSettings, useLogout, useMe } from '../hooks';
import { ProfileTabSkeleton } from '../skeletons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileTabScreen() {
  const navigation = useNavigation<NavProp>();
  const { data: user, isLoading: isLoadingMe } = useMe();
  const { data: business, isLoading: isLoadingBusiness } = useBusinessSettings();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  if ((isLoadingMe && !user) || (isLoadingBusiness && !business)) {
    return (
      <View style={styles.screen}>
        <ProfileTabSkeleton />
      </View>
    );
  }

  const companyName =
    business?.businessName || user?.name || 'WishBox Inventory';
  const email = business?.email || user?.email || '';
  const phone = user?.phone ? `+91 ${user.phone}` : '—';
  const logoUrl = business?.logoUrl
    ? business.logoUrl.startsWith('http')
      ? business.logoUrl
      : `${API_ORIGIN}${business.logoUrl}`
    : null;

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout(undefined, {
      onSettled: () => {
        authStore.logout();
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <Building2 size={28} color={colors.primary} />
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.companyName} numberOfLines={1}>
              {companyName}
            </Text>
            <View style={styles.metaRow}>
              <Phone size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{phone}</Text>
            </View>
            {email ? (
              <View style={styles.metaRow}>
                <Mail size={12} color={colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Settings List */}
        <Text style={styles.sectionLabel}>ACCOUNT & SETTINGS</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.iconBox}>
              <User size={19} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Edit Profile</Text>
              <Text style={styles.menuSub}>
                Company logo, name & email address
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('BusinessSettings')}
          >
            <View style={styles.iconBox}>
              <Building2 size={19} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Business & Invoice</Text>
              <Text style={styles.menuSub}>
                GSTIN, PAN, address, bank details & PDF footer
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('PaymentQr')}
          >
            <View style={styles.iconBox}>
              <QrCode size={19} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Payment & QR Code</Text>
              <Text style={styles.menuSub}>
                Upload UPI QR code & payment ID
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.75}
            onPress={() => setLogoutModalOpen(true)}
            disabled={isLoggingOut}
          >
            <View style={styles.logoutIconBox}>
              <LogOut size={19} color={colors.danger} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.logoutText}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Text>
              <Text style={styles.menuSub}>Sign out from this device</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <IosConfirmModal
        visible={logoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out from your account?"
        confirmText="Log Out"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.xs + 2,
    marginLeft: 2,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  menuSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutGroup: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
});
