import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../core/theme';
import type { StockEntryRecord } from '../types';

type StockEntryHistoryCardProps = {
  entry: StockEntryRecord;
  productId: string;
  unit: string;
  defaultExpanded?: boolean;
};

export function StockEntryHistoryCard({
  entry,
  productId,
  unit,
  defaultExpanded = false,
}: StockEntryHistoryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const matchedItem =
    entry.items.find((i) => String(i.product) === String(productId)) ??
    entry.items[0];
  const qty = matchedItem?.quantity ?? 0;
  const isPurchased = entry.sourceType === 'PURCHASED';

  const dateLabel = new Date(entry.entryDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const unitCost = entry.unitPurchaseCost ?? 0;
  const rawCost = entry.rawData?.productCost ?? 0;
  const readymadeCost = entry.readymadeData?.productCost ?? 0;
  const hasBreakdown = Boolean(entry.rawData || entry.readymadeData);
  const productCost = hasBreakdown
    ? Math.round((rawCost + readymadeCost) * 100) / 100
    : Math.round(unitCost * qty * 100) / 100;
  const transportCost = entry.transportCost ?? 0;
  const otherCost = entry.otherCost ?? 0;
  const totalCost = entry.totalPurchaseCost ?? entry.totalAmount ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.8}
    >
      {/* Summary Header */}
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={styles.titleRow}>
            <Text style={styles.entryNo}>{entry.entryNumber}</Text>
            <View
              style={[
                styles.sourceBadge,
                isPurchased ? styles.purchasedBadge : styles.selfBadge,
              ]}
            >
              <Text
                style={[
                  styles.sourceText,
                  isPurchased ? styles.purchasedText : styles.selfText,
                ]}
              >
                {isPurchased ? 'External' : 'In-House'}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText} numberOfLines={1}>
            {isPurchased && entry.supplierName
              ? `${entry.supplierName} • ${dateLabel}`
              : dateLabel}
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.qtyText}>
            +{qty} {unit}
          </Text>
          <View style={styles.costExpandRow}>
            <Text style={styles.costText}>₹ {totalCost}</Text>
            {expanded ? (
              <ChevronUp size={15} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={15} color={colors.textSecondary} />
            )}
          </View>
        </View>
      </View>

      {/* Expanded Full Details */}
      {expanded ? (
        <View style={styles.detailsBox}>
          <View style={styles.divider} />
          <DetailRow label="Action Date" value={dateLabel} />

          {isPurchased ? (
            <>
              <DetailRow label="Source" value="External (Purchased)" />
              <DetailRow
                label="Supplier"
                value={entry.supplierName || '—'}
              />
              <DetailRow
                label="Phone"
                value={entry.supplierPhone ? `+91 ${entry.supplierPhone}` : '—'}
              />
              {entry.supplierGstin ? (
                <DetailRow label="GST Number" value={entry.supplierGstin} />
              ) : null}
              {entry.purchaseCategory ? (
                <DetailRow
                  label="Purchase Type"
                  value={
                    entry.purchaseCategory === 'BOTH'
                      ? 'Raw + Readymade'
                      : entry.purchaseCategory === 'RAW'
                        ? 'Raw Data'
                        : 'Readymade Data'
                  }
                />
              ) : null}
              {entry.rawData ? (
                <DetailRow
                  label="Raw Material Cost"
                  value={
                    (entry.rawData.totalUnits ?? 0) > 0
                      ? `₹ ${rawCost} (${entry.rawData.totalUnits} × ₹${entry.rawData.unitCost ?? 0})`
                      : `₹ ${rawCost}`
                  }
                />
              ) : null}
              {entry.readymadeData ? (
                <DetailRow
                  label="Readymade Cost"
                  value={`₹ ${readymadeCost} (${entry.readymadeData.totalUnits ?? 0} × ₹${entry.readymadeData.unitCost ?? 0})`}
                />
              ) : null}
              <DetailRow label="Per Unit Cost" value={`₹ ${unitCost}`} />
              <DetailRow label="Total Units" value={`${qty} ${unit}`} />
              <DetailRow label="Product Cost" value={`₹ ${productCost}`} />
              <DetailRow label="Transport Cost" value={`₹ ${transportCost}`} />
              <DetailRow label="Other Cost" value={`₹ ${otherCost}`} />
              <DetailRow
                label="Grand Total Cost"
                value={`₹ ${totalCost}`}
                highlight
              />
            </>
          ) : (
            <>
              <DetailRow label="Source" value="In-House (Self Made)" />
              <DetailRow label="Quantity" value={`${qty} ${unit}`} />
              <DetailRow
                label="Total Cost"
                value={`₹ ${totalCost}`}
                highlight
              />
            </>
          )}

          {entry.remarks ? (
            <DetailRow label="Remarks" value={entry.remarks} />
          ) : null}
          {entry.createdBy?.name ? (
            <DetailRow label="Added By" value={entry.createdBy.name} />
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryNo: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  selfBadge: {
    backgroundColor: colors.primarySoft,
  },
  purchasedBadge: {
    backgroundColor: colors.warningBg,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  selfText: {
    color: colors.primary,
  },
  purchasedText: {
    color: colors.warning,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  qtyText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  costExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  costText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  detailsBox: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    gap: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  detailHighlight: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
