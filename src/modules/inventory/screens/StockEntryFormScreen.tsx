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
  createEmptyExpenseRow,
  getExpenseRowValidation,
  type ExpenseFieldRow,
} from '../components';
import { INVENTORY_COPY } from '../data';
import { colors } from '../../../core/theme';
import { useCreateExpense } from '../../financial/hooks';
import { useCreateProductAndStock, useCreateStockEntry } from '../hooks';
import { inventoryStyles } from '../styles';
import type { PurchaseCategory, StockSourceType } from '../types';

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
  const [selfUnitCost, setSelfUnitCost] = useState('');
  const [selfTotalUnits, setSelfTotalUnits] = useState('');

  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');

  const [hasRawData, setHasRawData] = useState(false);
  const [hasReadymadeData, setHasReadymadeData] = useState(true);

  const [rawUnitCost, setRawUnitCost] = useState('');
  const [rawTotalUnits, setRawTotalUnits] = useState('');
  const [rawProductCost, setRawProductCost] = useState('');

  const [readymadeUnitCost, setReadymadeUnitCost] = useState('');
  const [readymadeTotalUnits, setReadymadeTotalUnits] = useState('');

  const [transportCost, setTransportCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [remarks, setRemarks] = useState('');

  const [expenseRows, setExpenseRows] = useState<ExpenseFieldRow[]>(() => [
    createEmptyExpenseRow(),
  ]);
  const [expenseSubmitted, setExpenseSubmitted] = useState(false);

  const { mutate: createStockEntry, isPending: isAddingExisting } =
    useCreateStockEntry();
  const { mutate: createProductAndStock, isPending: isCreatingNew } =
    useCreateProductAndStock();
  const { mutateAsync: createExpense, isPending: isSavingExpense } =
    useCreateExpense();

  const isBusy = isAddingExisting || isCreatingNew || isSavingExpense;

  const handleAddExpenseRow = (presetKey = '') => {
    setExpenseRows((prev) => {
      if (presetKey) {
        const emptyIdx = prev.findIndex(
          (r) => r.key.trim().length === 0 && r.amount.trim().length === 0,
        );
        if (emptyIdx !== -1) {
          return prev.map((r, idx) =>
            idx === emptyIdx ? { ...r, key: presetKey } : r,
          );
        }
      }
      return [...prev, createEmptyExpenseRow(presetKey)];
    });
  };

  const handleUpdateExpenseRow = (
    id: string,
    field: 'key' | 'amount',
    val: string,
  ) => {
    setExpenseRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === 'amount' ? val.replace(/[^0-9.]/g, '') : val,
            }
          : r,
      ),
    );
  };

  const handleRemoveExpenseRow = (id: string) => {
    setExpenseRows((prev) =>
      prev.length > 1
        ? prev.filter((r) => r.id !== id)
        : [createEmptyExpenseRow()],
    );
  };

  const handleRawUnitCostChange = (val: string) => {
    setRawUnitCost(val);
    const u = Number(val) || 0;
    const q = Number(rawTotalUnits) || 0;
    if (u > 0 && q > 0) {
      setRawProductCost(String(Math.round(u * q * 100) / 100));
    }
  };

  const handleRawTotalUnitsChange = (val: string) => {
    setRawTotalUnits(val);
    const u = Number(rawUnitCost) || 0;
    const q = Number(val) || 0;
    if (u > 0 && q > 0) {
      setRawProductCost(String(Math.round(u * q * 100) / 100));
    }
  };

  const parsedSelfUnitCost = Number(selfUnitCost) || 0;
  const parsedSelfUnits = Number(selfTotalUnits) || 0;
  const selfTotalCost =
    Math.round(parsedSelfUnitCost * parsedSelfUnits * 100) / 100;

  const parsedRawUnitCost = Number(rawUnitCost) || 0;
  const parsedRawUnits = Number(rawTotalUnits) || 0;
  const parsedRawCost = hasRawData ? Number(rawProductCost) || 0 : 0;

  const parsedReadymadeUnitCost = Number(readymadeUnitCost) || 0;
  const parsedReadymadeUnits = Number(readymadeTotalUnits) || 0;
  const parsedReadymadeCost = hasReadymadeData
    ? Math.round(parsedReadymadeUnitCost * parsedReadymadeUnits * 100) / 100
    : 0;

  const parsedTransport = Number(transportCost) || 0;
  const parsedOther = Number(otherCost) || 0;

  const effectiveQty =
    sourceType === 'SELF_MADE'
      ? parsedSelfUnits
      : (hasRawData ? parsedRawUnits : 0) +
        (hasReadymadeData ? parsedReadymadeUnits : 0);

  const grandTotal =
    Math.round(
      (parsedRawCost + parsedReadymadeCost + parsedTransport + parsedOther) *
        100,
    ) / 100;

  const isRawValid = !hasRawData || rawProductCost.trim().length > 0;
  const isReadymadeValid =
    !hasReadymadeData ||
    (readymadeUnitCost.trim().length > 0 &&
      parsedReadymadeUnitCost >= 0 &&
      parsedReadymadeUnits > 0);

  const isSourceValid =
    sourceType === 'SELF_MADE'
      ? selfUnitCost.trim().length > 0 &&
        parsedSelfUnitCost >= 0 &&
        parsedSelfUnits > 0
      : supplierName.trim().length >= 2 &&
        INDIAN_PHONE_REGEX.test(supplierPhone.trim()) &&
        (hasRawData || hasReadymadeData) &&
        isRawValid &&
        isReadymadeValid;

  const isProductValid =
    mode === 'existing'
      ? Boolean(selectedId)
      : productName.trim().length >= 1 &&
        category.trim().length >= 1 &&
        imageUris.length >= 1;

  const hasExpenseRowErrors =
    sourceType === 'SELF_MADE' &&
    expenseRows.some((r) => {
      const v = getExpenseRowValidation(r);
      return Boolean(v.keyError || v.amtError);
    });

  const validExpenseItems =
    sourceType === 'SELF_MADE'
      ? expenseRows
          .map((r) => ({
            key: r.key.trim(),
            amount: Math.round((Number(r.amount) || 0) * 100) / 100,
          }))
          .filter((r) => r.key.length > 0 && r.amount > 0)
      : [];

  const expenseTotalAmount = validExpenseItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const canSubmit = isProductValid && isSourceValid;

  const saveInHouseExpenseIfNeeded = async (
    targetProductId: string,
    targetProductName: string,
  ): Promise<boolean> => {
    if (
      sourceType !== 'SELF_MADE' ||
      validExpenseItems.length === 0 ||
      expenseTotalAmount <= 0
    ) {
      return true;
    }
    const summaryKeys = validExpenseItems.map((i) => i.key).join(', ');
    try {
      await createExpense({
        category: 'IN_HOUSE_PRODUCTION',
        title: `${targetProductName} — ${summaryKeys}`,
        amount: Math.round(expenseTotalAmount * 100) / 100,
        productId: targetProductId,
        productName: targetProductName,
        lineItems: validExpenseItems,
        notes: remarks.trim() || undefined,
      });
      return true;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<null>>;
      popup.error(
        'Stock Added, Expense Failed',
        axiosErr.response?.data?.message ||
          'Stock was added, but production expenses failed to save.',
      );
      return false;
    }
  };

  const handleSubmit = () => {
    if (!canSubmit || isBusy) return;
    if (hasExpenseRowErrors) {
      setExpenseSubmitted(true);
      return;
    }

    const purchaseCategory: PurchaseCategory | undefined =
      sourceType === 'PURCHASED'
        ? hasRawData && hasReadymadeData
          ? 'BOTH'
          : hasRawData
            ? 'RAW'
            : 'READYMADE'
        : undefined;

    const weightedUnitCost =
      effectiveQty > 0
        ? Math.round(((parsedRawCost + parsedReadymadeCost) / effectiveQty) * 100) /
          100
        : parsedRawCost;

    const purchaseFields =
      sourceType === 'PURCHASED'
        ? {
            sourceType,
            supplierName: supplierName.trim(),
            supplierPhone: supplierPhone.trim(),
            ...(supplierGstin.trim()
              ? { supplierGstin: supplierGstin.trim() }
              : {}),
            purchaseCategory,
            ...(hasRawData
              ? {
                  rawData: {
                    unitCost: parsedRawUnitCost,
                    totalUnits: parsedRawUnits,
                    productCost: parsedRawCost,
                  },
                }
              : {}),
            ...(hasReadymadeData
              ? {
                  readymadeData: {
                    unitCost: parsedReadymadeUnitCost,
                    totalUnits: parsedReadymadeUnits,
                    productCost: parsedReadymadeCost,
                  },
                }
              : {}),
            unitPurchaseCost: weightedUnitCost,
            transportCost: parsedTransport,
            otherCost: parsedOther,
            totalPurchaseCost: grandTotal,
          }
        : {
            sourceType,
            unitPurchaseCost: parsedSelfUnitCost,
            totalPurchaseCost: selfTotalCost,
          };

    if (mode === 'existing') {
      createStockEntry(
        {
          remarks: remarks.trim() || undefined,
          ...purchaseFields,
          items: [{ productId: selectedId, quantity: effectiveQty }],
        },
        {
          onSuccess: async () => {
            const expenseOk = await saveInHouseExpenseIfNeeded(
              selectedId,
              selectedName || 'Product',
            );
            if (expenseOk) {
              popup.success(
                'Stock Added',
                effectiveQty > 0
                  ? `Added ${effectiveQty} units to ${selectedName || 'product'}.`
                  : `Purchase entry recorded for ${selectedName || 'product'}.`,
              );
            }
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
          purchaseCost:
            sourceType === 'PURCHASED' ? weightedUnitCost : parsedSelfUnitCost,
          imageUris,
        },
        quantity: effectiveQty,
        remarks: remarks.trim() || undefined,
        ...purchaseFields,
      },
      {
        onSuccess: async (created) => {
          const createdId = created?.data?._id ?? '';
          const trimmedName = productName.trim();
          const expenseOk = createdId
            ? await saveInHouseExpenseIfNeeded(createdId, trimmedName)
            : true;
          if (expenseOk) {
            popup.success(
              'Product & Stock Added',
              `${trimmedName} created with ${effectiveQty} units.`,
            );
          }
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

          <PurchaseSourceFields
            sourceType={sourceType}
            supplierName={supplierName}
            supplierPhone={supplierPhone}
            supplierGstin={supplierGstin}
            hasRawData={hasRawData}
            hasReadymadeData={hasReadymadeData}
            rawUnitCost={rawUnitCost}
            rawTotalUnits={rawTotalUnits}
            rawProductCost={rawProductCost}
            readymadeUnitCost={readymadeUnitCost}
            readymadeTotalUnits={readymadeTotalUnits}
            selfUnitCost={selfUnitCost}
            selfTotalUnits={selfTotalUnits}
            expenseRows={expenseRows}
            expenseSubmitted={expenseSubmitted}
            transportCost={transportCost}
            otherCost={otherCost}
            disabled={isBusy}
            onChangeSource={setSourceType}
            onChangeSupplierName={setSupplierName}
            onChangeSupplierPhone={setSupplierPhone}
            onChangeSupplierGstin={setSupplierGstin}
            onToggleRawData={() => setHasRawData((prev) => !prev)}
            onToggleReadymadeData={() => setHasReadymadeData((prev) => !prev)}
            onChangeRawUnitCost={handleRawUnitCostChange}
            onChangeRawTotalUnits={handleRawTotalUnitsChange}
            onChangeRawProductCost={setRawProductCost}
            onChangeReadymadeUnitCost={setReadymadeUnitCost}
            onChangeReadymadeTotalUnits={setReadymadeTotalUnits}
            onChangeSelfUnitCost={setSelfUnitCost}
            onChangeSelfTotalUnits={setSelfTotalUnits}
            onAddExpenseRow={handleAddExpenseRow}
            onUpdateExpenseRow={handleUpdateExpenseRow}
            onRemoveExpenseRow={handleRemoveExpenseRow}
            onChangeTransportCost={setTransportCost}
            onChangeOtherCost={setOtherCost}
          />

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
