import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { INVENTORY_COPY } from '../data';
import { inventoryStyles } from '../styles';
import type { StockSourceType } from '../types';
import {
  InHouseExpenseFields,
  type ExpenseFieldRow,
} from './InHouseExpenseFields';
import { SupplierPickerSheet } from './SupplierPickerSheet';

type PurchaseSourceFieldsProps = {
  sourceType: StockSourceType;
  supplierName: string;
  supplierPhone: string;
  supplierGstin: string;
  hasRawData: boolean;
  hasReadymadeData: boolean;
  rawUnitCost: string;
  rawTotalUnits: string;
  rawProductCost: string;
  readymadeUnitCost: string;
  readymadeTotalUnits: string;
  selfUnitCost: string;
  selfTotalUnits: string;
  expenseRows: ExpenseFieldRow[];
  expenseSubmitted: boolean;
  transportCost: string;
  otherCost: string;
  disabled?: boolean;
  onChangeSource: (type: StockSourceType) => void;
  onChangeSupplierName: (val: string) => void;
  onChangeSupplierPhone: (val: string) => void;
  onChangeSupplierGstin: (val: string) => void;
  onToggleRawData: () => void;
  onToggleReadymadeData: () => void;
  onChangeRawUnitCost: (val: string) => void;
  onChangeRawTotalUnits: (val: string) => void;
  onChangeRawProductCost: (val: string) => void;
  onChangeReadymadeUnitCost: (val: string) => void;
  onChangeReadymadeTotalUnits: (val: string) => void;
  onChangeSelfUnitCost: (val: string) => void;
  onChangeSelfTotalUnits: (val: string) => void;
  onAddExpenseRow: (presetKey?: string) => void;
  onUpdateExpenseRow: (id: string, field: 'key' | 'amount', val: string) => void;
  onRemoveExpenseRow: (id: string) => void;
  onChangeTransportCost: (val: string) => void;
  onChangeOtherCost: (val: string) => void;
};

const cleanDecimal = (val: string) => val.replace(/[^0-9.]/g, '');

export function PurchaseSourceFields({
  sourceType,
  supplierName,
  supplierPhone,
  supplierGstin,
  hasRawData,
  hasReadymadeData,
  rawUnitCost,
  rawTotalUnits,
  rawProductCost,
  readymadeUnitCost,
  readymadeTotalUnits,
  selfUnitCost,
  selfTotalUnits,
  expenseRows,
  expenseSubmitted,
  transportCost,
  otherCost,
  disabled = false,
  onChangeSource,
  onChangeSupplierName,
  onChangeSupplierPhone,
  onChangeSupplierGstin,
  onToggleRawData,
  onToggleReadymadeData,
  onChangeRawUnitCost,
  onChangeRawTotalUnits,
  onChangeRawProductCost,
  onChangeReadymadeUnitCost,
  onChangeReadymadeTotalUnits,
  onChangeSelfUnitCost,
  onChangeSelfTotalUnits,
  onAddExpenseRow,
  onUpdateExpenseRow,
  onRemoveExpenseRow,
  onChangeTransportCost,
  onChangeOtherCost,
}: PurchaseSourceFieldsProps) {
  const parsedRawCost = hasRawData ? Number(rawProductCost) || 0 : 0;
  const parsedReadymadeCost = hasReadymadeData
    ? Math.round(
        (Number(readymadeUnitCost) || 0) *
          (Number(readymadeTotalUnits) || 0) *
          100,
      ) / 100
    : 0;
  const parsedTransport = Number(transportCost) || 0;
  const parsedOther = Number(otherCost) || 0;
  const grandTotal =
    Math.round(
      (parsedRawCost + parsedReadymadeCost + parsedTransport + parsedOther) *
        100,
    ) / 100;

  const selfTotalCost =
    Math.round(
      (Number(selfUnitCost) || 0) * (Number(selfTotalUnits) || 0) * 100,
    ) / 100;

  return (
    <View>
      <Text style={inventoryStyles.label}>
        {INVENTORY_COPY.form.sourceLabel}
      </Text>
      <View style={inventoryStyles.modeSwitchRow}>
        <TouchableOpacity
          style={[
            inventoryStyles.modeTab,
            sourceType === 'SELF_MADE' && inventoryStyles.modeTabActive,
          ]}
          onPress={() => onChangeSource('SELF_MADE')}
          disabled={disabled}
        >
          <Text
            style={[
              inventoryStyles.modeTabText,
              sourceType === 'SELF_MADE' && inventoryStyles.modeTabTextActive,
            ]}
          >
            {INVENTORY_COPY.form.selfMadeTab}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            inventoryStyles.modeTab,
            sourceType === 'PURCHASED' && inventoryStyles.modeTabActive,
          ]}
          onPress={() => onChangeSource('PURCHASED')}
          disabled={disabled}
        >
          <Text
            style={[
              inventoryStyles.modeTabText,
              sourceType === 'PURCHASED' && inventoryStyles.modeTabTextActive,
            ]}
          >
            {INVENTORY_COPY.form.purchasedTab}
          </Text>
        </TouchableOpacity>
      </View>

      {sourceType === 'SELF_MADE' ? (
        <View>
          <View style={inventoryStyles.rowTwoCol}>
            <View style={inventoryStyles.colHalf}>
              <Text style={inventoryStyles.label}>Per Unit Price (₹) *</Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={selfUnitCost}
                onChangeText={(val) => onChangeSelfUnitCost(cleanDecimal(val))}
              />
            </View>

            <View style={inventoryStyles.colHalf}>
              <Text style={inventoryStyles.label}>Total Units *</Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={selfTotalUnits}
                onChangeText={(val) =>
                  onChangeSelfTotalUnits(cleanDecimal(val))
                }
              />
            </View>
          </View>

          <Text style={inventoryStyles.label}>Total Cost (₹)</Text>
          <View style={inventoryStyles.readonlyBox}>
            <Text style={inventoryStyles.readonlyValue}>
              ₹ {selfTotalCost.toLocaleString('en-IN')}
            </Text>
          </View>

          <InHouseExpenseFields
            rows={expenseRows}
            submitted={expenseSubmitted}
            disabled={disabled}
            onAddRow={onAddExpenseRow}
            onUpdateRow={onUpdateExpenseRow}
            onRemoveRow={onRemoveExpenseRow}
          />
        </View>
      ) : (
        <>
          <SupplierPickerSheet
            supplierName={supplierName}
            onSelectSupplier={(name, phone) => {
              onChangeSupplierName(name);
              onChangeSupplierPhone(phone);
            }}
          />

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.supplierPhoneLabel}
          </Text>
          <TextInput
            style={inventoryStyles.textInput}
            placeholder={INVENTORY_COPY.form.supplierPhonePlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={supplierPhone}
            onChangeText={(val) =>
              onChangeSupplierPhone(val.replace(/\D/g, '').slice(0, 10))
            }
          />

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.supplierGstinLabel}
          </Text>
          <TextInput
            style={inventoryStyles.textInput}
            placeholder={INVENTORY_COPY.form.supplierGstinPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={15}
            value={supplierGstin}
            onChangeText={(val) =>
              onChangeSupplierGstin(val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            }
          />

          <Text style={inventoryStyles.label}>
            Purchase Type * (Select one or both)
          </Text>
          <View style={styles.checkRow}>
            <TouchableOpacity
              style={[styles.checkChip, hasRawData && styles.checkChipActive]}
              onPress={onToggleRawData}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <View
                style={[styles.checkBox, hasRawData && styles.checkBoxActive]}
              >
                {hasRawData ? (
                  <Check size={12} color={colors.textInverse} strokeWidth={3} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.checkLabel,
                  hasRawData && styles.checkLabelActive,
                ]}
              >
                Raw Data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkChip,
                hasReadymadeData && styles.checkChipActive,
              ]}
              onPress={onToggleReadymadeData}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkBox,
                  hasReadymadeData && styles.checkBoxActive,
                ]}
              >
                {hasReadymadeData ? (
                  <Check size={12} color={colors.textInverse} strokeWidth={3} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.checkLabel,
                  hasReadymadeData && styles.checkLabelActive,
                ]}
              >
                Readymade Data
              </Text>
            </TouchableOpacity>
          </View>

          {hasRawData ? (
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Raw Data</Text>
              <View style={inventoryStyles.rowTwoCol}>
                <View style={inventoryStyles.colHalf}>
                  <Text style={inventoryStyles.label}>Per Unit (Optional)</Text>
                  <TextInput
                    style={inventoryStyles.textInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={rawUnitCost}
                    onChangeText={(val) =>
                      onChangeRawUnitCost(cleanDecimal(val))
                    }
                  />
                </View>

                <View style={inventoryStyles.colHalf}>
                  <Text style={inventoryStyles.label}>
                    Total Units (Optional)
                  </Text>
                  <TextInput
                    style={inventoryStyles.textInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={rawTotalUnits}
                    onChangeText={(val) =>
                      onChangeRawTotalUnits(cleanDecimal(val))
                    }
                  />
                </View>
              </View>

              <Text style={inventoryStyles.label}>Product Cost (₹) *</Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder="Enter or auto-calculated cost"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={rawProductCost}
                onChangeText={(val) =>
                  onChangeRawProductCost(cleanDecimal(val))
                }
              />
            </View>
          ) : null}

          {hasReadymadeData ? (
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Readymade Data</Text>
              <View style={inventoryStyles.rowTwoCol}>
                <View style={inventoryStyles.colHalf}>
                  <Text style={inventoryStyles.label}>
                    {INVENTORY_COPY.form.unitCostLabel}
                  </Text>
                  <TextInput
                    style={inventoryStyles.textInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={readymadeUnitCost}
                    onChangeText={(val) =>
                      onChangeReadymadeUnitCost(cleanDecimal(val))
                    }
                  />
                </View>

                <View style={inventoryStyles.colHalf}>
                  <Text style={inventoryStyles.label}>
                    {INVENTORY_COPY.form.totalUnitsLabel}
                  </Text>
                  <TextInput
                    style={inventoryStyles.textInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={readymadeTotalUnits}
                    onChangeText={(val) =>
                      onChangeReadymadeTotalUnits(cleanDecimal(val))
                    }
                  />
                </View>
              </View>

              <Text style={inventoryStyles.label}>
                {INVENTORY_COPY.form.productCostLabel}
              </Text>
              <View style={inventoryStyles.readonlyBox}>
                <Text style={inventoryStyles.readonlyValue}>
                  ₹ {parsedReadymadeCost.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={inventoryStyles.rowTwoCol}>
            <View style={inventoryStyles.colHalf}>
              <Text style={inventoryStyles.label}>
                {INVENTORY_COPY.form.transportCostLabel}
              </Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={transportCost}
                onChangeText={(val) =>
                  onChangeTransportCost(cleanDecimal(val))
                }
              />
            </View>

            <View style={inventoryStyles.colHalf}>
              <Text style={inventoryStyles.label}>
                {INVENTORY_COPY.form.otherCostLabel}
              </Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={otherCost}
                onChangeText={(val) => onChangeOtherCost(cleanDecimal(val))}
              />
            </View>
          </View>

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.totalCostLabel}
          </Text>
          <View style={inventoryStyles.readonlyBox}>
            <Text style={inventoryStyles.readonlyValue}>
              ₹ {grandTotal.toLocaleString('en-IN')}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  checkLabelActive: {
    color: colors.primary,
  },
  subCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  subCardTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});
