import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function BusinessSettingsSkeleton() {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SkeletonBox width="45%" height={16} />

        {[0, 1, 2].map((k) => (
          <View key={k} style={styles.fieldGroup}>
            <SkeletonBox width="36%" height={12} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
        ))}

        <View style={styles.row}>
          <View style={styles.half}>
            <SkeletonBox width="50%" height={12} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
          <View style={styles.half}>
            <SkeletonBox width="40%" height={12} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <SkeletonBox width="45%" height={12} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
          <View style={styles.half}>
            <SkeletonBox width="40%" height={12} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
        </View>

        <SkeletonBox
          width="100%"
          height={48}
          borderRadius={radius.md}
          style={styles.mt16}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  mt6: {
    marginTop: 6,
  },
  mt16: {
    marginTop: 16,
  },
});
