import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';

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

export type SelectedMonth = {
  year: number;
  month: number | null;
} | null;

export function getMonthRange(year: number, month: number | null) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Period</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

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

          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((mName, idx) => {
              const isFuture =
                pickerYear > now.getFullYear() ||
                (pickerYear === now.getFullYear() && idx > now.getMonth());
              if (isFuture) {
                return null;
              }
              const isSelected =
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
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footerActionsRow}>
            <TouchableOpacity
              style={[
                styles.allTimeBtn,
                styles.footerActionBtn,
                selectedMonth?.year === pickerYear &&
                  selectedMonth?.month === null &&
                  styles.allTimeBtnActive,
              ]}
              onPress={() => {
                onSelect({ year: pickerYear, month: null });
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.allTimeBtnText,
                  selectedMonth?.year === pickerYear &&
                    selectedMonth?.month === null &&
                    styles.allTimeBtnTextActive,
                ]}
              >
                Full Year {pickerYear}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.allTimeBtn,
                styles.footerActionBtn,
                selectedMonth === null && styles.allTimeBtnActive,
              ]}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.allTimeBtnText,
                  selectedMonth === null && styles.allTimeBtnTextActive,
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
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
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  yearArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  yearArrowPlaceholder: {
    width: 34,
    height: 34,
  },
  yearText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  monthCell: {
    width: '31.5%',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
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
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerActionBtn: {
    flex: 1,
  },
  allTimeBtn: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  allTimeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  allTimeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  allTimeBtnTextActive: {
    color: colors.surface,
  },
});
