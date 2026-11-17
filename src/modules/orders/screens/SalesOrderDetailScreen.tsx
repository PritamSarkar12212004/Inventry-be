import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessageCircle, Share2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { downloadAndShareOrderPdf } from '../functions';
import { useSalesOrderDetail } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'SalesOrderDetail'>;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function SalesOrderDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const { data: order, isLoading } = useSalesOrderDetail(orderId);
  const [sharingMode, setSharingMode] = useState<'pdf' | 'whatsapp' | null>(null);

  const handleSharePdf = async (viaWhatsApp: boolean) => {
    if (!order) return;
    setSharingMode(viaWhatsApp ? 'whatsapp' : 'pdf');
    try {
      await downloadAndShareOrderPdf({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerSnapshot?.phone,
        viaWhatsApp,
      });
    } catch (err) {
      popup.error(
        'PDF Error',
        err instanceof Error ? err.message : 'Unable to download/share PDF.',
      );
    } finally {
      setSharingMode(null);
    }
  };

  if (isLoading || !order) {
    return (
      <View style={inventoryStyles.centerBox}>
        <IosLoader size={28} color={colors.primary} />
      </View>
    );
  }

  const hasGst = Boolean(order.includeGst && Number(order.tax || 0) > 0);
  const taxableVal = Math.max(
    0,
    Number(order.subtotal || 0) - Number(order.discount || 0),
  );

  return (
    <SafeAreaView style={inventoryStyles.formScreen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={[styles.badge, hasGst ? styles.gstOn : styles.gstOff]}>
              <Text
                style={[
                  styles.badgeText,
                  hasGst ? styles.gstOnText : styles.gstOffText,
                ]}
              >
                {hasGst ? 'TAX INVOICE (GST)' : 'NON-GST INVOICE'}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>Date: {formatDate(order.orderDate)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text style={styles.custName}>
            {order.customerSnapshot?.name || 'Walk-In Customer'}
          </Text>
          {order.customerSnapshot?.phone ? (
            <Text style={styles.custMeta}>
              Phone: {order.customerSnapshot.phone}
            </Text>
          ) : null}
          {order.billingAddress ? (
            <Text style={styles.custMeta}>{order.billingAddress}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ITEMS ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View
              key={item._id || `${item.product}-${idx}`}
              style={styles.itemRow}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  {item.orderedQuantity} {item.unit} × ₹{item.sellingPrice}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ₹{Number(item.taxableAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>
                ₹{taxableVal.toLocaleString('en-IN')}
              </Text>
            </View>
            {hasGst ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST (CGST + SGST)</Text>
                <Text style={styles.totalVal}>
                  ₹{Number(order.tax || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
            <View style={[styles.totalRow, styles.finalRow]}>
              <Text style={styles.finalLabel}>Final Total</Text>
              <Text style={styles.finalVal}>
                ₹{Number(order.grandTotal || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.whatsappBtn}
            activeOpacity={0.85}
            disabled={sharingMode !== null}
            onPress={() => handleSharePdf(true)}
          >
            {sharingMode === 'whatsapp' ? (
              <IosLoader size={18} color={colors.textInverse} />
            ) : (
              <MessageCircle size={18} color={colors.textInverse} />
            )}
            <Text style={styles.whatsappBtnText}>Share PDF on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            activeOpacity={0.85}
            disabled={sharingMode !== null}
            onPress={() => handleSharePdf(false)}
          >
            {sharingMode === 'pdf' ? (
              <IosLoader size={18} color={colors.primary} />
            ) : (
              <Share2 size={18} color={colors.primary} />
            )}
            <Text style={styles.shareBtnText}>Download / Share PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  gstOn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  gstOff: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  gstOnText: {
    color: colors.success,
  },
  gstOffText: {
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  custName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  custMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalsBox: {
    marginTop: spacing.md,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: 4,
  },
  finalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  finalVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  actionsWrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#16A34A',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  whatsappBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
