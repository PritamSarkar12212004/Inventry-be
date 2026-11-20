import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
  touchTarget,
} from '../../../core/theme';

export type ExpenseFieldRow = {
  id: string;
  key: string;
  amount: string;
};

export const QUICK_EXPENSE_KEYS = [
  'Punching',
  'Printing',
  'Die Cutting',
  'Lamination',
  'Pasting',
];

export const createEmptyExpenseRow = (presetKey = ''): ExpenseFieldRow => ({
  id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  key: presetKey,
  amount: '',
});

export function getExpenseRowValidation(row: ExpenseFieldRow) {
  const hasKey = row.key.trim().length > 0;
  const parsedAmt = Number(row.amount);
  const hasAmt =
    row.amount.trim().length > 0 && !Number.isNaN(parsedAmt) && parsedAmt > 0;
  return {
    hasKey,
    hasAmt,
    keyError: !hasKey && hasAmt ? 'Field name is required' : '',
    amtError: hasKey && !hasAmt ? 'Value is required' : '',
  };
}

type InHouseExpenseFieldsProps = {
  rows: ExpenseFieldRow[];
  submitted: boolean;
  disabled?: boolean;
  onAddRow: (presetKey?: string) => void;
  onUpdateRow: (id: string, field: 'key' | 'amount', val: string) => void;
  onRemoveRow: (id: string) => void;
};

export function InHouseExpenseFields({
  rows,
  submitted,
  disabled = false,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}: InHouseExpenseFieldsProps) {
  const totalAmount = rows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Expenses</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {QUICK_EXPENSE_KEYS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={styles.quickChip}
            onPress={() => onAddRow(preset)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Plus size={12} color={colors.primary} />
            <Text style={styles.quickChipText}>{preset}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.rowsHeader}>
        <Text style={styles.colKeyLabel}>Expense Name</Text>
        <Text style={styles.colAmtLabel}>Cost (₹)</Text>
      </View>

      {rows.map((row) => {
        const { keyError, amtError } = submitted
          ? getExpenseRowValidation(row)
          : { keyError: '', amtError: '' };
        return (
          <View key={row.id} style={styles.fieldRowWrap}>
            <View style={styles.fieldRow}>
              <TextInput
                style={[styles.keyInput, keyError ? styles.inputError : null]}
                placeholder="e.g. Punching"
                placeholderTextColor={colors.textMuted}
                value={row.key}
                editable={!disabled}
                onChangeText={(v) => onUpdateRow(row.id, 'key', v)}
              />
              <TextInput
                style={[styles.amtInput, amtError ? styles.inputError : null]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={row.amount}
                editable={!disabled}
                onChangeText={(v) => onUpdateRow(row.id, 'amount', v)}
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemoveRow(row.id)}
                disabled={disabled}
              >
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
            {keyError || amtError ? (
              <Text style={styles.rowErrorText}>{keyError || amtError}</Text>
            ) : null}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.addRowBtn}
        onPress={() => onAddRow('')}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Plus size={18} color={colors.primary} />
        <Text style={styles.addRowText}>Add Another Expense</Text>
      </TouchableOpacity>

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Production Expense</Text>
        <Text style={styles.totalVal}>
          ₹{totalAmount.toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  quickChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  rowsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  colKeyLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  colAmtLabel: {
    width: 96,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  fieldRowWrap: {
    marginBottom: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  keyInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  amtInput: {
    width: 96,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  rowErrorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 4,
  },
  removeBtn: {
    width: 34,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  addRowText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  totalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
