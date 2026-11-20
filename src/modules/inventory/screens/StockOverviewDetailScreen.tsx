import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  IndianRupee,
  Layers,
  PackageCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { useInventorySummary } from '../hooks';

function fmtNum(val?: number): string {
  return Number(val || 0).toLocaleString('en-IN');
}

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

type OverviewListRow = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
  onPress?: () => void;
};

type OverviewSection = {
  title: string;
  rows: OverviewListRow[];
};

export function StockOverviewDetailScreen() {
  const navigation = useNavigation();
  const { data: summary, isLoading, isRefetching, refetch } =
    useInventorySummary();

  const handleOpenAlerts = () => {
    const navAny = navigation as unknown as {
      navigate: (name: string, params?: Record<string, unknown>) => void;
    };
    navAny.navigate('Main', {
      screen: 'StockTab',
      params: { screen: 'LowStock' },
    });
  };

  if (isLoading && !summary) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={86} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={170}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={170}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={220}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const totalProducts = Math.max(summary?.totalProducts ?? 0, 0);
  const inStock = Math.max(summary?.inStockCount ?? 0, 0);
  const lowStock = Math.max(summary?.lowStockCount ?? 0, 0);
  const outStock = Math.max(summary?.outOfStockCount ?? 0, 0);
  const healthyPct =
    totalProducts > 0 ? Math.round((inStock / totalProducts) * 100) : 100;

  const totalStockValue = Number(summary?.totalStockValue || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const netStockValue = totalStockValue - totalExpenses;
  const fmtSignedMoney = (val: number) =>
    val < 0
      ? `-₹${Math.abs(val).toLocaleString('en-IN')}`
      : fmtMoney(val);

  const sections: OverviewSection[] = [
    {
      title: 'STOCK STATUS',
      rows: [
        {
          label: 'In Stock Products',
          value: fmtNum(inStock),
          icon: <CheckCircle2 size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Low Stock Alerts',
          value: fmtNum(lowStock),
          icon: <AlertTriangle size={17} color={colors.warning} />,
          accent: colors.warning,
          onPress: handleOpenAlerts,
        },
        {
          label: 'Out of Stock',
          value: fmtNum(outStock),
          icon: <XCircle size={17} color={colors.danger} />,
          accent: colors.danger,
          onPress: handleOpenAlerts,
        },
      ],
    },
    {
      title: 'CATALOG SUMMARY',
      rows: [
        {
          label: 'Total Products',
          value: fmtNum(totalProducts),
          icon: <Layers size={17} color={colors.primary} />,
        },
        {
          label: 'Active Products',
          value: fmtNum(summary?.activeProducts),
          icon: <PackageCheck size={17} color={colors.primary} />,
        },
        {
          label: 'Categories',
          value: fmtNum(summary?.totalCategories),
          icon: <FolderKanban size={17} color={colors.primary} />,
        },
      ],
    },
    {
      title: 'STOCK VALUATION',
      rows: [
        {
          label: 'Total Stock Value',
          value: fmtMoney(totalStockValue),
          icon: <TrendingUp size={17} color={colors.primary} />,
          accent: colors.primary,
        },
        {
          label: 'Total Expenses',
          value: fmtMoney(totalExpenses),
          icon: <IndianRupee size={17} color={colors.warning} />,
          accent: colors.warning,
        },
        {
          label: 'Net Stock Value',
          value: fmtSignedMoney(netStockValue),
          icon: <TrendingUp size={17} color={netStockValue < 0 ? colors.danger : colors.success} />,
          accent: netStockValue < 0 ? colors.danger : colors.success,
        },
      ],
    },
    {
      title: 'QUANTITY BREAKDOWN',
      rows: [
        {
          label: 'Total Stock Quantity',
          value: fmtNum(summary?.totalStockQuantity),
          icon: <Boxes size={17} color={colors.textPrimary} />,
        },
        {
          label: 'Available Quantity',
          value: fmtNum(summary?.totalAvailableQuantity),
          icon: <CheckCircle2 size={17} color={colors.success} />,
          accent: colors.success,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.healthBanner}>
          <View style={styles.healthTopRow}>
            <View>
              <Text style={styles.eyebrow}>INVENTORY HEALTH</Text>
              <Text style={styles.bannerTitle}>Overall Stock Health</Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthText}>{healthyPct}% Healthy</Text>
            </View>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${healthyPct}%` }]} />
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.listCard}>
              {section.rows.map((row, idx) => {
                const rowStyle = [
                  styles.listRow,
                  idx === section.rows.length - 1 && styles.listRowLast,
                ];
                const content = (
                  <>
                    <View style={styles.rowLeft}>
                      <View style={styles.iconWrap}>{row.icon}</View>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {row.label}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text
                        style={[
                          styles.rowValue,
                          row.accent ? { color: row.accent } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {row.value}
                      </Text>
                      {row.onPress ? (
                        <ChevronRight size={16} color={colors.textMuted} />
                      ) : null}
                    </View>
                  </>
                );

                return row.onPress ? (
                  <TouchableOpacity
                    key={row.label}
                    style={rowStyle}
                    onPress={row.onPress}
                    activeOpacity={0.75}
                  >
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View key={row.label} style={rowStyle}>
                    {content}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  mt12: {
    marginTop: spacing.md,
  },
  healthBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  healthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.7,
  },
  bannerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  healthBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  healthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm + 4,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  sectionBlock: {
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    paddingHorizontal: 4,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
