import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../core/theme';
import { INVENTORY_COPY } from '../data';
import { inventoryStyles } from '../styles';
import type { StockSourceType } from '../types';
import { SupplierPickerSheet } from './SupplierPickerSheet';

type PurchaseSourceFieldsProps = {
  sourceType: StockSourceType;
  supplierName: string;
  supplierPhone: string;
  supplierGstin: string;
  unitCost: string;
  totalUnits: string;
  transportCost: string;
  otherCost: string;
  disabled?: boolean;
  onChangeSource: (type: StockSourceType) => void;
  onChangeSupplierName: (val: string) => void;
  onChangeSupplierPhone: (val: string) => void;
  onChangeSupplierGstin: (val: string) => void;
  onChangeUnitCost: (val: string) => void;
  onChangeTotalUnits: (val: string) => void;
  onChangeTransportCost: (val: string) => void;
  onChangeOtherCost: (val: string) => void;
};

export function PurchaseSourceFields({
  sourceType,
  supplierName,
  supplierPhone,
  supplierGstin,
  unitCost,
  totalUnits,
  transportCost,
  otherCost,
  disabled = false,
  onChangeSource,
  onChangeSupplierName,
  onChangeSupplierPhone,
  onChangeSupplierGstin,
  onChangeUnitCost,
  onChangeTotalUnits,
  onChangeTransportCost,
  onChangeOtherCost,
}: PurchaseSourceFieldsProps) {
  const parsedUnitCost = Number(unitCost) || 0;
  const parsedUnits = Number(totalUnits) || 0;
  const parsedTransport = Number(transportCost) || 0;
  const parsedOther = Number(otherCost) || 0;

  const productCost = Math.round(parsedUnitCost * parsedUnits * 100) / 100;
  const grandTotal =
    Math.round((productCost + parsedTransport + parsedOther) * 100) / 100;

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

      {sourceType === 'PURCHASED' ? (
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
                value={unitCost}
                onChangeText={(val) =>
                  onChangeUnitCost(val.replace(/[^0-9.]/g, ''))
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
                value={totalUnits}
                onChangeText={(val) =>
                  onChangeTotalUnits(val.replace(/[^0-9.]/g, ''))
                }
              />
            </View>
          </View>

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.productCostLabel}
          </Text>
          <View style={inventoryStyles.readonlyBox}>
            <Text style={inventoryStyles.readonlyValue}>₹ {productCost}</Text>
          </View>

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
                  onChangeTransportCost(val.replace(/[^0-9.]/g, ''))
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
                onChangeText={(val) =>
                  onChangeOtherCost(val.replace(/[^0-9.]/g, ''))
                }
              />
            </View>
          </View>

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.totalCostLabel}
          </Text>
          <View style={inventoryStyles.readonlyBox}>
            <Text style={inventoryStyles.readonlyValue}>₹ {grandTotal}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
