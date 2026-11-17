import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Trash2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { ProductPickerSheet } from '../../inventory/components';
import { inventoryStyles } from '../../inventory/styles';
import type { InventoryItem } from '../../inventory/types';
import { CustomerPickerSheet } from '../components';
import { useCreateSalesOrder } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'SalesOrderForm'>;

type DraftOrderLine = {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  availableStock: number;
  qtyText: string;
  priceText: string;
  gstRate: number;
};

export function SalesOrderFormScreen({ navigation }: Props) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [includeGst, setIncludeGst] = useState(false);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftOrderLine[]>([]);

  const { mutate: createOrder, isPending } = useCreateSalesOrder();

  const handleSelectCustomer = (cust: {
    customerId: string | null;
    name: string;
    phone: string;
    address: string;
  }) => {
    setCustomerId(cust.customerId);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setBillingAddress(cust.address);
  };

  const handleSelectMultipleProducts = (selected: InventoryItem[]) => {
    const outOfStock = selected.filter((p) => Number(p.currentStock || 0) <= 0);
    if (outOfStock.length > 0) {
      popup.error(
        'Out of Stock',
        `${outOfStock.map((p) => p.productName).join(', ')} has 0 stock and cannot be added.`,
      );
    }

    const inStock = selected.filter((p) => Number(p.currentStock || 0) > 0);
    setLines((prev) => {
      const existingMap = new Map(prev.map((l) => [l.productId, l]));
      return inStock.map((product) => {
        const existing = existingMap.get(product.productId);
        if (existing) return existing;
        const defaultPrice = Number(product.defaultSellingPrice || 0) || 0;
        return {
          productId: product.productId,
          productName: product.productName,
          productCode: product.productCode,
          unit: product.unit,
          availableStock: product.currentStock,
          qtyText: '1',
          priceText: defaultPrice > 0 ? String(defaultPrice) : '',
          gstRate: 18,
        };
      });
    });
  };

  const updateLine = (
    productId: string,
    patch: Partial<Pick<DraftOrderLine, 'qtyText' | 'priceText'>>,
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        if (patch.qtyText !== undefined) {
          const parsed = Number(patch.qtyText);
          if (!Number.isNaN(parsed) && parsed > l.availableStock) {
            popup.error(
              'Stock Limit Reached',
              `Only ${l.availableStock} ${l.unit} available for ${l.productName}.`,
            );
            return { ...l, qtyText: String(l.availableStock) };
          }
        }
        return { ...l, ...patch };
      }),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const summary = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    for (const line of lines) {
      const qty = Math.max(0, Number(line.qtyText) || 0);
      const price = Math.max(0, Number(line.priceText) || 0);
      const lineGross = qty * price;
      const lineTax = includeGst ? (lineGross * line.gstRate) / 100 : 0;
      subtotal += lineGross;
      totalTax += lineTax;
    }
    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax,
    };
  }, [lines, includeGst]);

  const handleSubmit = () => {
    if (!customerName.trim()) {
      popup.error('Customer Name Required', 'Please enter customer name.');
      return;
    }
    if (lines.length === 0) {
      popup.error('Add Products', 'Please add at least 1 product.');
      return;
    }

    const itemsPayload = [];
    for (const line of lines) {
      const qty = Number(line.qtyText);
      const price = Number(line.priceText);
      if (!line.qtyText.trim() || Number.isNaN(qty) || qty <= 0) {
        popup.error(
          'Quantity Required',
          `Enter a valid quantity (> 0) for ${line.productName}.`,
        );
        return;
      }
      if (qty > line.availableStock) {
        popup.error(
          'Insufficient Stock',
          `Only ${line.availableStock} ${line.unit} available for ${line.productName}.`,
        );
        return;
      }
      if (!line.priceText.trim() || Number.isNaN(price) || price <= 0) {
        popup.error(
          'Unit Price Required',
          `Enter a valid unit price (> 0) for ${line.productName}.`,
        );
        return;
      }
      itemsPayload.push({
        productId: line.productId,
        orderedQuantity: qty,
        sellingPrice: price,
        gstRate: includeGst ? line.gstRate : 0,
      });
    }

    createOrder(
      {
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        includeGst,
        notes: notes.trim() || undefined,
        items: itemsPayload,
      },
      {
        onSuccess: (res) => {
          popup.success('Sale Created', 'Order saved and PDF is ready to share.');
          navigation.goBack();
          navigation.navigate('SalesOrderDetail', { orderId: res.data._id });
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Error',
            axiosErr.response?.data?.message || 'Failed to create sales order.',
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
          showsVerticalScrollIndicator={false}
        >
          <CustomerPickerSheet
            customerName={customerName}
            onSelectCustomer={handleSelectCustomer}
          />

          <Text style={styles.label}>Phone / WhatsApp Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={(val) => {
              setCustomerId(null);
              setCustomerPhone(val);
            }}
          />

          <Text style={styles.label}>Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Shop / City address"
            placeholderTextColor={colors.textMuted}
            value={billingAddress}
            onChangeText={setBillingAddress}
          />

          <View style={styles.productsSection}>
            <ProductPickerSheet
              multiSelect
              selectedIds={lines.map((l) => l.productId)}
              selectedName={
                lines.length > 0
                  ? `${lines.length} product${lines.length === 1 ? '' : 's'} selected`
                  : 'Tap to select products...'
              }
              onSelectMultiple={handleSelectMultipleProducts}
            />
          </View>

          {lines.map((line) => {
            const lineAmt =
              (Number(line.qtyText) || 0) * (Number(line.priceText) || 0);
            return (
              <View key={line.productId} style={styles.lineCard}>
                <View style={styles.lineHeader}>
                  <View style={styles.lineTitleWrap}>
                    <Text style={styles.lineName} numberOfLines={1}>
                      {line.productName}
                    </Text>
                    <Text style={styles.lineMeta}>
                      {line.productCode} • In Stock: {line.availableStock}{' '}
                      {line.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLine(line.productId)}
                    style={styles.removeBtn}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.lineInputsRow}>
                  <View style={styles.lineCol}>
                    <Text style={styles.miniLabel}>Unit Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      placeholder="Enter price"
                      placeholderTextColor={colors.textMuted}
                      value={line.priceText}
                      onChangeText={(v) =>
                        updateLine(line.productId, { priceText: v })
                      }
                    />
                  </View>
                  <View style={styles.lineCol}>
                    <Text style={styles.miniLabel}>Qty ({line.unit}) *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                      value={line.qtyText}
                      onChangeText={(v) =>
                        updateLine(line.productId, { qtyText: v })
                      }
                    />
                  </View>
                  <View style={styles.lineTotalCol}>
                    <Text style={styles.miniLabel}>Amount</Text>
                    <Text style={styles.lineAmount}>
                      ₹{lineAmt.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Include GST (18%)</Text>
              <Text style={styles.switchSubtitle}>
                {includeGst
                  ? 'CGST 9% + SGST 9% will be added to invoice'
                  : 'No GST will be added (Non-GST Bill)'}
              </Text>
            </View>
            <Switch
              value={includeGst}
              onValueChange={setIncludeGst}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <Text style={styles.label}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Delivery or payment notes..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>
                ₹{summary.subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
            {includeGst ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (CGST 9% + SGST 9%)</Text>
                <Text style={styles.summaryVal}>
                  ₹{summary.totalTax.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Final Total</Text>
              <Text style={styles.totalVal}>
                ₹{summary.grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.submitWrap}>
            <AuthButton
              title="Create Sale & Generate PDF"
              onPress={handleSubmit}
              loading={isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  pickCustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  pickCustText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  productsSection: {
    marginTop: spacing.lg,
  },
  lineCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lineTitleWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  lineName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  lineMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  lineInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  lineCol: {
    flex: 1,
  },
  lineTotalCol: {
    minWidth: 80,
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
  },
  miniLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  lineAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  submitWrap: {
    marginTop: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  custRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  custRowName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  custRowMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCustText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
});
