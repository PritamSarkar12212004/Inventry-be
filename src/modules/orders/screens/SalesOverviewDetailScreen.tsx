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
  CheckCircle2,
  ChevronRight,
  Clock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Wallet,
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
import { useFinancialOverview } from '../../financial/hooks';

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

export function SalesOverviewDetailScreen() {
  const navigation = useNavigation();
  const { data: overview, isLoading, isRefetching, refetch } =
    useFinancialOverview();

  const handleOpenReceive = () => {
    const navAny = navigation as unknown as {
      navigate: (name: string, params?: Record<string, unknown>) => void;
    };
    navAny.navigate('Main', { screen: 'ReceiveTab' });
  };

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={86} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={180}
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

  const totalSales = Math.max(overview?.totalSales || 0, 0);
  const totalReceived = Math.max(overview?.totalReceived || 0, 0);
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  const sections: OverviewSection[] = [
    {
      title: 'SALES & COLLECTION',
      rows: [
        {
          label: 'Total Sales',
          value: fmtMoney(overview?.totalSales),
          icon: <TrendingUp size={17} color={colors.primary} />,
          accent: colors.primary,
        },
        {
          label: 'Total Received',
          value: fmtMoney(overview?.totalReceived),
          icon: <IndianRupee size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Pending Due',
          value: fmtMoney(overview?.totalPendingDue),
          icon: <Wallet size={17} color={colors.warning} />,
          accent: colors.warning,
          onPress: handleOpenReceive,
        },
      ],
    },
    {
      title: 'ORDERS BREAKDOWN',
      rows: [
        {
          label: 'Total Orders',
          value: fmtNum(overview?.totalOrders),
          icon: <ShoppingBag size={17} color={colors.textPrimary} />,
        },
        {
          label: 'Paid Orders',
          value: fmtNum(overview?.paidOrdersCount),
          icon: <CheckCircle2 size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Partial Paid Orders',
          value: fmtNum(overview?.partialOrdersCount),
          icon: <Clock size={17} color={colors.warning} />,
          accent: colors.warning,
        },
        {
          label: 'Unpaid Orders',
          value: fmtNum(overview?.unpaidOrdersCount),
          icon: <XCircle size={17} color={colors.danger} />,
          accent: colors.danger,
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
              <Text style={styles.eyebrow}>SALES OVERVIEW</Text>
              <Text style={styles.bannerTitle}>Collection Progress</Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthText}>{collectedPct}% Collected</Text>
            </View>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${collectedPct}%` }]} />
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
