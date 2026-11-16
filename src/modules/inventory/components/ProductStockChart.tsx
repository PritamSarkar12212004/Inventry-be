import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { IosLoader } from '../../../core/components/IosLoader';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../core/theme';
import { useProductAnalytics } from '../hooks';
import type { AnalyticsPeriod } from '../types';

type ProductStockChartProps = {
  productId: string;
  unit: string;
};

export function ProductStockChart({ productId, unit }: ProductStockChartProps) {
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data, isLoading } = useProductAnalytics(
    productId,
    period,
    period === 'month' ? selectedYear : undefined,
  );

  const barData = useMemo<barDataItem[]>(() => {
    const points = data?.points ?? [];
    const items: barDataItem[] = [];

    for (const pt of points) {
      items.push({
        value: pt.added,
        label: pt.label,
        spacing: 3,
        labelWidth: 28,
        labelTextStyle: styles.axisLabel,
        frontColor: colors.success,
      });
      items.push({
        value: pt.sold,
        frontColor: colors.primary,
      });
    }

    return items;
  }, [data]);

  const maxVal = useMemo(() => {
    const points = data?.points ?? [];
    let max = 10;
    for (const pt of points) {
      if (pt.added > max) max = pt.added;
      if (pt.sold > max) max = pt.sold;
    }
    return Math.ceil(max * 1.2);
  }, [data]);

  const years = data?.availableYears ?? [currentYear];

  const targetScrollIndex = useMemo(() => {
    const points = data?.points ?? [];
    if (points.length === 0) return 0;

    if (period === 'month') {
      const currentMonthIdx = new Date().getMonth(); // 0 = Jan, 10 = Nov
      return Math.max(0, currentMonthIdx * 2 - 4);
    }

    const currentYearIdx = points.findIndex(
      (pt) => pt.label === String(currentYear),
    );
    if (currentYearIdx === -1) {
      return Math.max(0, points.length * 2 - 4);
    }
    return Math.max(0, currentYearIdx * 2 - 2);
  }, [data, period, currentYear]);

  return (
    <View style={styles.card}>
      {/* Header + Period Toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Stock Analytics</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              period === 'month' && styles.toggleBtnActive,
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                styles.toggleText,
                period === 'month' && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              period === 'year' && styles.toggleBtnActive,
            ]}
            onPress={() => setPeriod('year')}
          >
            <Text
              style={[
                styles.toggleText,
                period === 'year' && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Year Chips when Monthly */}
      {period === 'month' && years.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearsRow}
        >
          {years.map((yr) => {
            const active = yr === selectedYear;
            return (
              <TouchableOpacity
                key={yr}
                style={[styles.yearChip, active && styles.yearChipActive]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text
                  style={[
                    styles.yearChipText,
                    active && styles.yearChipTextActive,
                  ]}
                >
                  {yr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Legend + Totals */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>
            Added: +{data?.totals.added ?? 0} {unit}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>
            Sold: -{data?.totals.sold ?? 0} {unit}
          </Text>
        </View>
      </View>

      {/* Bar Chart */}
      {isLoading || !data ? (
        <View style={styles.loaderBox}>
          <IosLoader size={22} color={colors.primary} />
        </View>
      ) : barData.length === 0 ? (
        <Text style={styles.emptyText}>No analytics data yet.</Text>
      ) : (
        <View style={styles.chartWrap}>
          <BarChart
            key={`${period}-${selectedYear}-${data.totals.added}-${data.totals.sold}`}
            data={barData}
            barWidth={9}
            spacing={14}
            initialSpacing={10}
            scrollToIndex={targetScrollIndex}
            scrollAnimation
            roundedTop
            hideRules
            xAxisThickness={1}
            yAxisThickness={0}
            xAxisColor={colors.border}
            yAxisTextStyle={styles.axisLabel}
            noOfSections={4}
            maxValue={maxVal}
            height={150}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  yearsRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  yearChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  yearChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  yearChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  chartWrap: {
    overflow: 'hidden',
    paddingTop: spacing.xs,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  loaderBox: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
});
