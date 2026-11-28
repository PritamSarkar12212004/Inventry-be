import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export type SelectedMonth =
  | {
      year: number;
      month: number | null;
      preset?: 'LAST_3_MONTHS';
    }
  | null;

export function getMonthRange(
  year: number,
  month: number | null,
  preset?: 'LAST_3_MONTHS',
) {
  if (preset === 'LAST_3_MONTHS') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: 'Last 3M',
    };
  }
  if (month === null) {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `Year ${year}`,
    };
  }
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: `${MONTH_NAMES[month]} ${year}`,
  };
}

export function getSelectedPeriodRange(selected: SelectedMonth) {
  if (!selected) return null;
  return getMonthRange(selected.year, selected.month, selected.preset);
}

type MonthYearPickerModalProps = {
  visible: boolean;
  selectedMonth: SelectedMonth;
  onSelect: (month: SelectedMonth) => void;
  onClose: () => void;
};

export function MonthYearPickerModal({
  visible,
  selectedMonth,
  onSelect,
  onClose,
}: MonthYearPickerModalProps) {
  const now = useMemo(() => new Date(), []);
  const [pickerYear, setPickerYear] = useState<number>(() =>
    selectedMonth?.year ?? now.getFullYear(),
  );

  useEffect(() => {
    if (visible) {
      setPickerYear(selectedMonth?.year ?? now.getFullYear());
    }
  }, [visible, selectedMonth, now]);

  const isThisMonth =
    !selectedMonth?.preset &&
    selectedMonth?.year === now.getFullYear() &&
    selectedMonth?.month === now.getMonth();
  const isLast3Months = selectedMonth?.preset === 'LAST_3_MONTHS';
  const isFullYear =
    !selectedMonth?.preset &&
    selectedMonth?.year === pickerYear &&
    selectedMonth?.month === null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Calendar size={17} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Select Period</Text>
                <Text style={styles.subtitle}>
                  Filter by month, quarter or year
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <X size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetBtn, isThisMonth && styles.presetBtnActive]}
              onPress={() => {
                onSelect({ year: now.getFullYear(), month: now.getMonth() });
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  isThisMonth && styles.presetBtnTextActive,
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                isLast3Months && styles.presetBtnActive,
              ]}
              onPress={() => {
                onSelect({
                  year: now.getFullYear(),
                  month: null,
                  preset: 'LAST_3_MONTHS',
                });
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  isLast3Months && styles.presetBtnTextActive,
                ]}
              >
                Last 3 Months
              </Text>
            </TouchableOpacity>
          </View>

          {/* Year Switcher */}
          <View style={styles.yearSwitchRow}>
            <TouchableOpacity
              onPress={() => setPickerYear((y) => y - 1)}
              style={styles.yearArrowBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{pickerYear}</Text>
            {pickerYear < now.getFullYear() ? (
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y + 1)}
                style={styles.yearArrowBtn}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.yearArrowPlaceholder} />
            )}
          </View>

          {/* Month Grid */}
          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((mName, idx) => {
              const isFuture =
                pickerYear > now.getFullYear() ||
                (pickerYear === now.getFullYear() && idx > now.getMonth());
              if (isFuture) {
                return null;
              }
              const isSelected =
                !selectedMonth?.preset &&
                selectedMonth?.year === pickerYear &&
                selectedMonth?.month === idx;
              const isCurrent =
                now.getFullYear() === pickerYear && now.getMonth() === idx;

              return (
                <TouchableOpacity
                  key={mName}
                  style={[
                    styles.monthCell,
                    isCurrent && !isSelected && styles.monthCellCurrent,
                    isSelected && styles.monthCellActive,
                  ]}
                  onPress={() => {
                    onSelect({ year: pickerYear, month: idx });
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.monthCellText,
                      isCurrent && !isSelected && styles.monthCellTextCurrent,
                      isSelected && styles.monthCellTextActive,
                    ]}
                  >
                    {mName}
                  </Text>
                  {isCurrent && !isSelected ? (
                    <View style={styles.currentDot} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footerDivider} />

          {/* Footer Actions */}
          <View style={styles.footerActionsRow}>
            <TouchableOpacity
              style={[
                styles.footerActionBtn,
                isFullYear && styles.footerActionBtnActive,
              ]}
              onPress={() => {
                onSelect({ year: pickerYear, month: null });
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.footerActionText,
                  isFullYear && styles.footerActionTextActive,
                ]}
              >
                Full Year {pickerYear}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerActionBtn,
                selectedMonth === null && styles.footerActionBtnActive,
              ]}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.footerActionText,
                  selectedMonth === null && styles.footerActionTextActive,
                ]}
              >
                All Time
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '94%',
    maxWidth: 390,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  presetBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  presetBtnTextActive: {
    color: colors.surface,
  },
  yearSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  yearArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  yearArrowPlaceholder: {
    width: 34,
    height: 34,
  },
  yearText: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  monthCell: {
    width: '31.4%',
    minHeight: 46,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  monthCellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  monthCellText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  monthCellTextCurrent: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  monthCellTextActive: {
    color: colors.surface,
    fontWeight: fontWeight.bold,
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: spacing.sm + 2,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerActionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  footerActionText: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  footerActionTextActive: {
    color: colors.surface,
  },
});
