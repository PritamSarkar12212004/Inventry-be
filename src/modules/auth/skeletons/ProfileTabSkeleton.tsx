import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function ProfileTabSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <SkeletonBox width={60} height={60} borderRadius={radius.md} />
        <View style={styles.infoCol}>
          <SkeletonBox width="65%" height={18} />
          <SkeletonBox width="45%" height={12} style={styles.mt6} />
          <SkeletonBox width="55%" height={12} style={styles.mt4} />
        </View>
      </View>

      <SkeletonBox width={130} height={11} style={styles.sectionLabel} />

      <View style={styles.menuGroup}>
        {[0, 1].map((idx) => (
          <View
            key={idx}
            style={[styles.menuRow, idx === 1 && styles.borderTop]}
          >
            <SkeletonBox width={40} height={40} borderRadius={radius.sm} />
            <View style={styles.infoCol}>
              <SkeletonBox width="45%" height={15} />
              <SkeletonBox width="70%" height={12} style={styles.mt6} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.logoutCard}>
        <SkeletonBox width={40} height={40} borderRadius={radius.sm} />
        <View style={styles.infoCol}>
          <SkeletonBox width="32%" height={15} />
          <SkeletonBox width="52%" height={12} style={styles.mt6} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  infoCol: {
    flex: 1,
  },
  sectionLabel: {
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
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
});
