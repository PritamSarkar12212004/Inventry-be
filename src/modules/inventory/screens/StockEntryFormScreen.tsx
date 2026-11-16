import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { popup } from '../../../core/store/popupStore';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import {
  NewProductFields,
  PurchaseSourceFields,
} from '../components';
import { INVENTORY_COPY } from '../data';
import { colors } from '../../../core/theme';
import { useCreateProductAndStock, useCreateStockEntry } from '../hooks';
import { inventoryStyles } from '../styles';
import type { StockSourceType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'StockEntryForm'>;
type StockMode = 'existing' | 'new';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function StockEntryFormScreen({ route, navigation }: Props) {
  const preselected = route.params;
  const mode: StockMode = preselected?.productId ? 'existing' : 'new';

  const selectedId = preselected?.productId ?? '';
  const selectedName = preselected?.productName ?? '';

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  const [sourceType, setSourceType] = useState<StockSourceType>('SELF_MADE');
  const [selfQuantity, setSelfQuantity] = useState('');
  const [selfTotalCost, setSelfTotalCost] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [remarks, setRemarks] = useState('');

  const { mutate: createStockEntry, isPending: isAddingExisting } =
    useCreateStockEntry();
  const { mutate: createProductAndStock, isPending: isCreatingNew } =
    useCreateProductAndStock();

  const isBusy = isAddingExisting || isCreatingNew;
  const effectiveQty =
    sourceType === 'SELF_MADE'
      ? Number(selfQuantity) || 0
      : Number(totalUnits) || 0;

  const parsedSelfCost = Number(selfTotalCost) || 0;
  const parsedUnitCost = Number(unitCost) || 0;
  const parsedTransport = Number(transportCost) || 0;
  const parsedOther = Number(otherCost) || 0;
  const productCost = Math.round(parsedUnitCost * effectiveQty * 100) / 100;
  const grandTotal =
    Math.round((productCost + parsedTransport + parsedOther) * 100) / 100;

  const isSourceValid =
    sourceType === 'SELF_MADE'
      ? selfTotalCost.trim().length > 0 && parsedSelfCost >= 0
      : supplierName.trim().length >= 2 &&
        INDIAN_PHONE_REGEX.test(supplierPhone.trim()) &&
        unitCost.trim().length > 0 &&
        parsedUnitCost >= 0;

  const isProductValid =
    mode === 'existing'
      ? Boolean(selectedId)
      : productName.trim().length >= 1 &&
        category.trim().length >= 1 &&
        imageUris.length >= 1;

  const canSubmit = isProductValid && effectiveQty > 0 && isSourceValid;

  const handleSubmit = () => {
    if (!canSubmit || isBusy) return;

    const purchaseFields =
      sourceType === 'PURCHASED'
        ? {
            sourceType,
            supplierName: supplierName.trim(),
            supplierPhone: supplierPhone.trim(),
            ...(supplierGstin.trim()
              ? { supplierGstin: supplierGstin.trim() }
              : {}),
            unitPurchaseCost: parsedUnitCost,
            transportCost: parsedTransport,
            otherCost: parsedOther,
            totalPurchaseCost: grandTotal,
          }
        : {
            sourceType,
            totalPurchaseCost: parsedSelfCost,
          };

    if (mode === 'existing') {
      createStockEntry(
        {
          remarks: remarks.trim() || undefined,
          ...purchaseFields,
          items: [{ productId: selectedId, quantity: effectiveQty }],
        },
        {
          onSuccess: () => {
            popup.success(
              'Stock Added',
              `Added ${effectiveQty} units to ${selectedName || 'product'}.`,
            );
            navigation.goBack();
          },
          onError: (err) => {
            const axiosErr = err as AxiosError<ApiResponse<null>>;
            popup.error(
              'Add Stock Failed',
              axiosErr.response?.data?.message || 'Could not add stock.',
            );
          },
        },
      );
      return;
    }

    createProductAndStock(
      {
        product: {
          name: productName.trim(),
          category: category.trim(),
          purchaseCost: sourceType === 'PURCHASED' ? parsedUnitCost : 0,
          imageUris,
        },
        quantity: effectiveQty,
        remarks: remarks.trim() || undefined,
        ...purchaseFields,
      },
      {
        onSuccess: () => {
          popup.success(
            'Product & Stock Added',
            `${productName.trim()} created with ${effectiveQty} units.`,
          );
          navigation.goBack();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          popup.error(
            'Create Failed',
            axiosErr.response?.data?.message || 'Could not create product.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={inventoryStyles.formScreen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={inventoryStyles.formScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={inventoryStyles.formScroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {mode === 'existing' ? (
            <View>
              <Text style={inventoryStyles.label}>Product</Text>
              <View style={inventoryStyles.readonlyBox}>
                <Text style={inventoryStyles.readonlyValue} numberOfLines={1}>
                  {selectedName}
                </Text>
              </View>
            </View>
          ) : (
            <NewProductFields
              name={productName}
              category={category}
              imageUris={imageUris}
              onChangeName={setProductName}
              onChangeCategory={setCategory}
              onChangeImages={setImageUris}
            />
          )}

          {/* Stock Source right below Select Product / New Product so its position stays fixed */}
          <PurchaseSourceFields
            sourceType={sourceType}
            supplierName={supplierName}
            supplierPhone={supplierPhone}
            supplierGstin={supplierGstin}
            unitCost={unitCost}
            totalUnits={totalUnits}
            transportCost={transportCost}
            otherCost={otherCost}
            disabled={isBusy}
            onChangeSource={setSourceType}
            onChangeSupplierName={setSupplierName}
            onChangeSupplierPhone={setSupplierPhone}
            onChangeSupplierGstin={setSupplierGstin}
            onChangeUnitCost={setUnitCost}
            onChangeTotalUnits={setTotalUnits}
            onChangeTransportCost={setTransportCost}
            onChangeOtherCost={setOtherCost}
          />

          {/* Quantity & Total Cost shown below Stock Source when SELF_MADE */}
          {sourceType === 'SELF_MADE' ? (
            <>
              <Text style={inventoryStyles.label}>
                {INVENTORY_COPY.form.quantityLabel}
              </Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder={INVENTORY_COPY.form.quantityPlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={selfQuantity}
                onChangeText={(val) =>
                  setSelfQuantity(val.replace(/[^0-9.]/g, ''))
                }
              />

              <Text style={inventoryStyles.label}>
                {INVENTORY_COPY.form.selfTotalCostLabel}
              </Text>
              <TextInput
                style={inventoryStyles.textInput}
                placeholder={INVENTORY_COPY.form.selfTotalCostPlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={selfTotalCost}
                onChangeText={(val) =>
                  setSelfTotalCost(val.replace(/[^0-9.]/g, ''))
                }
              />
            </>
          ) : null}

          <Text style={inventoryStyles.label}>
            {INVENTORY_COPY.form.remarksLabel}
          </Text>
          <TextInput
            style={inventoryStyles.remarksInput}
            placeholder={INVENTORY_COPY.form.remarksPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            value={remarks}
            onChangeText={setRemarks}
          />

          <View style={inventoryStyles.formFooter}>
            <AuthButton
              title={
                mode === 'existing'
                  ? INVENTORY_COPY.form.submitExisting
                  : INVENTORY_COPY.form.submitNew
              }
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={isBusy}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
