import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function ProductFormSkeleton() {
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageRow}>
          <SkeletonBox width={88} height={88} borderRadius={radius.md} />
          <SkeletonBox width={88} height={88} borderRadius={radius.md} />
        </View>

        {[0, 1, 2, 3].map((k) => (
          <View key={k} style={styles.fieldGroup}>
            <SkeletonBox width="35%" height={13} />
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
            <SkeletonBox width="50%" height={13} />
            <SkeletonBox
              width="100%"
              height={46}
              borderRadius={radius.md}
              style={styles.mt6}
            />
          </View>
          <View style={styles.half}>
            <SkeletonBox width="50%" height={13} />
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  imageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
