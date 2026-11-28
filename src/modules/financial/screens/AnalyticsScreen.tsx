import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import {
  AlertCircle,
  Boxes,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { downloadAndShareExcel } from '../../../core/util/downloadExcel';
import {
  MonthYearPickerModal,
  type SelectedMonth,
  getMonthRange,
} from '../components/MonthYearPickerModal';
import { useBusinessAnalytics } from '../hooks';
import type { AnalyticsExportType } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function fmtMoney(val?: number): string {
  const n = Number(val || 0);
  const abs = Math.abs(Math.round(n));
  return `${n < 0 ? '-' : ''}₹${abs.toLocaleString('en-IN')}`;
}

function fmtCompact(val?: number): string {
  const n = Number(val || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

type KpiItem = {
  label: string;
  value: string;
  color?: string;
};

type AnalyticsModuleCardProps = {
  title: string;
  accentColor: string;
  accentBg: string;
  icon: React.ReactNode;
  kpis: [KpiItem, KpiItem, KpiItem];
  footerMeta: string;
  exportType: AnalyticsExportType;
  isDownloading: boolean;
  onDownload: (type: AnalyticsExportType) => void;
  onPress: () => void;
};

function AnalyticsModuleCard({
  title,
  accentColor,
  accentBg,
  icon,
  kpis,
  footerMeta,
  exportType,
  isDownloading,
  onDownload,
  onPress,
}: AnalyticsModuleCardProps) {
  return (
    <TouchableOpacity
      style={styles.moduleCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Card Header: Icon + Title + Separate Excel Download Button */}
      <View style={styles.moduleHeader}>
        <View style={styles.moduleTitleRow}>
          <View style={[styles.moduleIconBox, { backgroundColor: accentBg }]}>
            {icon}
          </View>
          <Text style={styles.moduleTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.excelBtn,
            { borderColor: `${accentColor}40`, backgroundColor: accentBg },
          ]}
          activeOpacity={0.75}
          disabled={isDownloading}
          onPress={(e) => {
            e.stopPropagation();
            onDownload(exportType);
          }}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <>
              <Download size={13} color={accentColor} strokeWidth={2.4} />
              <Text style={[styles.excelBtnText, { color: accentColor }]}>
                Excel
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 3 Live KPIs */}
      <View style={styles.kpiRow}>
        {kpis.map((kpi, idx) => (
          <View
            key={kpi.label}
            style={[styles.kpiCol, idx > 0 && styles.kpiColDivider]}
          >
            <Text style={styles.kpiLabel} numberOfLines={1}>
              {kpi.label}
            </Text>
            <Text
              style={[
                styles.kpiValue,
                kpi.color ? { color: kpi.color } : undefined,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {kpi.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Card Footer: Summary Meta + Direct Screen Link */}
      <View style={styles.moduleFooter}>
        <Text style={styles.footerMeta} numberOfLines={1}>
          {footerMeta}
        </Text>
        <View style={styles.viewLinkRow}>
          <Text style={styles.viewLinkText}>View Details</Text>
          <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function AnalyticsScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [downloadingType, setDownloadingType] =
    useState<AnalyticsExportType | null>(null);

  const dateRange = useMemo(() => {
    if (!selectedMonth) return null;
    return getMonthRange(
      selectedMonth.year,
      selectedMonth.month,
      selectedMonth.preset,
    );
  }, [selectedMonth]);

  const periodLabel = dateRange?.label ?? 'All Time';

  const { data, isLoading, isRefetching, refetch } = useBusinessAnalytics(
    dateRange?.startDate,
    dateRange?.endDate,
  );

  // Place blue-bordered Period Selector in the header right (consistent with app)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Analytics',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerDateBtn}
          activeOpacity={0.8}
          onPress={() => setPickerVisible(true)}
        >
          <Calendar size={14} color={colors.primary} strokeWidth={2.2} />
          <Text style={styles.headerDateText} numberOfLines={1}>
            {periodLabel}
          </Text>
          <ChevronDown size={14} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, periodLabel]);

  const handleDownload = useCallback(
    async (type: AnalyticsExportType) => {
      if (downloadingType) return;
      try {
        setDownloadingType(type);
        const queryParts = [`type=${encodeURIComponent(type)}`];
        if (dateRange?.startDate) {
          queryParts.push(
            `startDate=${encodeURIComponent(dateRange.startDate)}`,
          );
        }
        if (dateRange?.endDate) {
          queryParts.push(`endDate=${encodeURIComponent(dateRange.endDate)}`);
        }
        const safePeriod = periodLabel.replace(/\s+/g, '_');
        const fileName =
          type === 'ALL'
            ? `WishBox_Complete_Report_${safePeriod}`
            : `WishBox_${type}_Report_${safePeriod}`;
        const shareTitle =
          type === 'ALL'
            ? `Complete Business Report (${periodLabel})`
            : `${type} Report (${periodLabel})`;

        await downloadAndShareExcel({
          endpointPath: `/financial/analytics/export?${queryParts.join('&')}`,
          fileName,
          title: shareTitle,
        });
      } catch (err: any) {
        Alert.alert(
          'Download Failed',
          err?.message || 'Unable to generate Excel report. Please try again.',
        );
      } finally {
        setDownloadingType(null);
      }
    },
    [dateRange?.endDate, dateRange?.startDate, downloadingType, periodLabel],
  );

  // Build Grouped BarChart data (Sales Received vs Total Spend)
  const barChartData = useMemo(() => {
    const trend = data?.monthlyTrend ?? [];
    if (trend.length === 0) return [];
    const items: Array<{
      value: number;
      label?: string;
      spacing?: number;
      labelWidth?: number;
      labelTextStyle?: { color: string; fontSize: number };
      frontColor: string;
    }> = [];
    trend.forEach((m) => {
      items.push({
        value: Math.max(0, m.salesReceived),
        label: m.label,
        spacing: 4,
        labelWidth: 42,
        labelTextStyle: { color: colors.textSecondary, fontSize: 10 },
        frontColor: '#2563EB',
      });
      items.push({
        value: Math.max(0, m.totalSpend),
        spacing: 18,
        frontColor: '#F97316',
      });
    });
    return items;
  }, [data?.monthlyTrend]);

  // Build Spend Breakdown Donut data
  const spendBreakdown = useMemo(() => {
    const eb = data?.expenseBreakdown;
    const total = eb?.totalSpend || 0;
    const rows = [
      {
        label: 'Material Purchase',
        value: eb?.materialPurchase || 0,
        color: '#EA580C',
      },
      {
        label: 'Manpower & Wages',
        value: eb?.manpower || 0,
        color: '#7C3AED',
      },
      {
        label: 'General & Transport',
        value: eb?.generalAndTransport || 0,
        color: '#D97706',
      },
    ];
    const pieData =
      total > 0
        ? rows
            .filter((r) => r.value > 0)
            .map((r) => ({ value: r.value, color: r.color }))
        : [{ value: 1, color: '#E2E8F0' }];
    return { rows, total, pieData };
  }, [data?.expenseBreakdown]);

  if (isLoading && !data) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading business analytics…</Text>
      </View>
    );
  }

  const hero = data?.hero;
  const cards = data?.cards;
  const isProfit = (hero?.netProfit ?? 0) >= 0;
  const collectionPct = Math.min(100, Math.max(0, hero?.collectionRatePct ?? 0));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* 1. Combined Master Excel Download Banner */}
        <View style={styles.masterBanner}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconWrap}>
              <FileSpreadsheet size={22} color="#2563EB" strokeWidth={2.2} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>Complete Business Excel</Text>
              <Text style={styles.masterSub} numberOfLines={1}>
                All 7 sheets combined • {periodLabel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.masterBtn}
            activeOpacity={0.85}
            disabled={downloadingType !== null}
            onPress={() => handleDownload('ALL')}
          >
            {downloadingType === 'ALL' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Download size={14} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.masterBtnText}>Download All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Hero Profit & Cashflow Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>
                NET PROFIT / CASHFLOW • {periodLabel.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.heroProfit,
                  { color: isProfit ? '#059669' : '#DC2626' },
                ]}
              >
                {fmtMoney(hero?.netProfit)}
              </Text>
            </View>
            <View
              style={[
                styles.marginBadge,
                { backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2' },
              ]}
            >
              <Text
                style={[
                  styles.marginBadgeText,
                  { color: isProfit ? '#059669' : '#DC2626' },
                ]}
              >
                {(hero?.profitMarginPct ?? 0) >= 0 ? '+' : ''}
                {hero?.profitMarginPct ?? 0}% Margin
              </Text>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricLabel}>Sales Received</Text>
              <Text style={[styles.heroMetricValue, { color: '#059669' }]}>
                {fmtMoney(hero?.salesReceived)}
              </Text>
            </View>
            <View style={[styles.heroMetricItem, styles.heroMetricDivider]}>
              <Text style={styles.heroMetricLabel}>Total Spend</Text>
              <Text style={[styles.heroMetricValue, { color: '#EA580C' }]}>
                {fmtMoney(hero?.totalSpend)}
              </Text>
            </View>
            <View style={[styles.heroMetricItem, styles.heroMetricDivider]}>
              <Text style={styles.heroMetricLabel}>Pending Due</Text>
              <Text style={[styles.heroMetricValue, { color: '#DC2626' }]}>
                {fmtMoney(hero?.pendingDue)}
              </Text>
            </View>
          </View>

          {/* Collection Health Progress Bar */}
          <View style={styles.collectionWrap}>
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionLabel}>Sales Collection Rate</Text>
              <Text style={styles.collectionPct}>{collectionPct}% Collected</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${collectionPct}%` }]}
              />
            </View>
          </View>
        </View>

        {/* 3A. Monthly Sales vs Spend Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Sales vs Spend Trend</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendText}>Sales</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendText}>Spend</Text>
              </View>
            </View>
          </View>

          {barChartData.length > 0 ? (
            <View style={styles.barWrap}>
              <BarChart
                data={barChartData}
                barWidth={14}
                roundedTop
                roundedBottom
                hideRules={false}
                rulesColor="#F1F5F9"
                xAxisThickness={1}
                xAxisColor="#E2E8F0"
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                noOfSections={4}
                height={150}
                formatYLabel={(lbl) => fmtCompact(Number(lbl))}
                isAnimated
              />
            </View>
          ) : (
            <Text style={styles.emptyChartText}>
              No monthly transactions recorded in this period.
            </Text>
          )}
        </View>

        {/* 3B. Spend Breakdown Donut Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spend Breakdown</Text>
          <View style={styles.donutRow}>
            <PieChart
              data={spendBreakdown.pieData}
              donut
              radius={54}
              innerRadius={34}
              innerCircleColor="#FFFFFF"
              centerLabelComponent={() => (
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterLabel}>Spend</Text>
                  <Text style={styles.donutCenterVal}>
                    {fmtCompact(spendBreakdown.total)}
                  </Text>
                </View>
              )}
            />

            <View style={styles.donutLegendCol}>
              {spendBreakdown.rows.map((row) => {
                const pct =
                  spendBreakdown.total > 0
                    ? Math.round((row.value / spendBreakdown.total) * 100)
                    : 0;
                return (
                  <View key={row.label} style={styles.donutLegendItem}>
                    <View style={styles.donutLegendLeft}>
                      <View
                        style={[styles.legendDot, { backgroundColor: row.color }]}
                      />
                      <Text style={styles.donutLegendLabel} numberOfLines={1}>
                        {row.label}
                      </Text>
                    </View>
                    <View style={styles.donutLegendRight}>
                      <Text style={styles.donutLegendAmt}>
                        {fmtMoney(row.value)}
                      </Text>
                      <Text style={styles.donutLegendPct}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Individual Analytics & Separate Excel Download Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>INDIVIDUAL REPORTS & EXPORTS</Text>
          <Text style={styles.sectionSub}>Tap card to open • Tap Excel to export</Text>
        </View>

        {/* Card 1: Profit & Loss */}
        <AnalyticsModuleCard
          title="Profit & Loss"
          accentColor="#059669"
          accentBg="#ECFDF5"
          icon={<TrendingUp size={18} color="#059669" strokeWidth={2.2} />}
          kpis={[
            { label: 'Income', value: fmtMoney(cards?.profit.income) },
            { label: 'Spend', value: fmtMoney(cards?.profit.spend) },
            {
              label: 'Net Profit',
              value: fmtMoney(cards?.profit.netProfit),
              color:
                (cards?.profit.netProfit ?? 0) >= 0 ? '#059669' : '#DC2626',
            },
          ]}
          footerMeta={`${cards?.profit.monthsCount ?? 0} Months • ${cards?.profit.profitMarginPct ?? 0}% Margin`}
          exportType="PROFIT"
          isDownloading={downloadingType === 'PROFIT'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('FinancialOverviewDetail')}
        />

        {/* Card 2: Sales Analytics */}
        <AnalyticsModuleCard
          title="Sales Analytics"
          accentColor="#2563EB"
          accentBg="#EFF6FF"
          icon={<Receipt size={18} color="#2563EB" strokeWidth={2.2} />}
          kpis={[
            { label: 'Billed', value: fmtMoney(cards?.sales.billed) },
            {
              label: 'Received',
              value: fmtMoney(cards?.sales.received),
              color: '#059669',
            },
            {
              label: 'Balance Due',
              value: fmtMoney(cards?.sales.balanceDue),
              color: '#DC2626',
            },
          ]}
          footerMeta={`${cards?.sales.invoiceCount ?? 0} Invoices • ${cards?.sales.collectionRatePct ?? 0}% Collected`}
          exportType="SALES"
          isDownloading={downloadingType === 'SALES'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('SalesOverviewDetail')}
        />

        {/* Card 3: Customer Pending */}
        <AnalyticsModuleCard
          title="Customer Pending"
          accentColor="#DC2626"
          accentBg="#FEF2F2"
          icon={<AlertCircle size={18} color="#DC2626" strokeWidth={2.2} />}
          kpis={[
            {
              label: 'Total Due',
              value: fmtMoney(cards?.pending.totalDue),
              color: '#DC2626',
            },
            {
              label: 'Pending Parties',
              value: String(cards?.pending.partyCount ?? 0),
            },
            {
              label: 'Oldest Due',
              value: `${cards?.pending.oldestDueDays ?? 0}d`,
              color:
                (cards?.pending.oldestDueDays ?? 0) > 30
                  ? '#DC2626'
                  : '#D97706',
            },
          ]}
          footerMeta="Party-wise pending bills & ageing"
          exportType="PENDING"
          isDownloading={downloadingType === 'PENDING'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('Finance')}
        />

        {/* Card 4: Material Purchase */}
        <AnalyticsModuleCard
          title="Material Purchase"
          accentColor="#EA580C"
          accentBg="#FFF7ED"
          icon={<ShoppingBag size={18} color="#EA580C" strokeWidth={2.2} />}
          kpis={[
            { label: 'Total Spend', value: fmtMoney(cards?.purchase.totalAmount) },
            { label: 'Material', value: fmtMoney(cards?.purchase.materialCost) },
            { label: 'Transport/Other', value: fmtMoney(cards?.purchase.extraCost) },
          ]}
          footerMeta={`${cards?.purchase.billCount ?? 0} Bills • ${cards?.purchase.supplierCount ?? 0} Suppliers`}
          exportType="PURCHASE"
          isDownloading={downloadingType === 'PURCHASE'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('SupplierOverviewDetail')}
        />

        {/* Card 5: Manpower & Wages */}
        <AnalyticsModuleCard
          title="Manpower & Wages"
          accentColor="#7C3AED"
          accentBg="#F5F3FF"
          icon={<Users size={18} color="#7C3AED" strokeWidth={2.2} />}
          kpis={[
            { label: 'Total Wages', value: fmtMoney(cards?.manpower.totalAmount) },
            {
              label: 'Paid',
              value: fmtMoney(cards?.manpower.paidAmount),
              color: '#059669',
            },
            {
              label: 'Pending',
              value: fmtMoney(cards?.manpower.pendingAmount),
              color:
                (cards?.manpower.pendingAmount ?? 0) > 0
                  ? '#DC2626'
                  : colors.textPrimary,
            },
          ]}
          footerMeta={`${cards?.manpower.workerCount ?? 0} Workers • ${cards?.manpower.entryCount ?? 0} Entries`}
          exportType="MANPOWER"
          isDownloading={downloadingType === 'MANPOWER'}
          onDownload={handleDownload}
          onPress={() =>
            navigation.navigate('ExpensesOverviewDetail', { mode: 'MANPOWER' })
          }
        />

        {/* Card 6: General & Transport Expenses */}
        <AnalyticsModuleCard
          title="General & Transport"
          accentColor="#D97706"
          accentBg="#FFFBEB"
          icon={<Truck size={18} color="#D97706" strokeWidth={2.2} />}
          kpis={[
            {
              label: 'Total Spend',
              value: fmtMoney(cards?.generalExpenses.totalAmount),
            },
            {
              label: 'Transport',
              value: fmtMoney(cards?.generalExpenses.transportAmount),
            },
            {
              label: 'Machine/Other',
              value: fmtMoney(cards?.generalExpenses.otherAmount),
            },
          ]}
          footerMeta={`${cards?.generalExpenses.entryCount ?? 0} Recorded Expenses`}
          exportType="EXPENSES"
          isDownloading={downloadingType === 'EXPENSES'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('GeneralExpensesOverview')}
        />

        {/* Card 7: Stock & Production Need */}
        <AnalyticsModuleCard
          title="Stock & Production"
          accentColor="#0D9488"
          accentBg="#F0FDFA"
          icon={<Boxes size={18} color="#0D9488" strokeWidth={2.2} />}
          kpis={[
            {
              label: 'Total SKUs',
              value: String(cards?.stock.totalSkus ?? 0),
            },
            {
              label: 'Low Stock',
              value: String(cards?.stock.lowStockCount ?? 0),
              color:
                (cards?.stock.lowStockCount ?? 0) > 0 ? '#DC2626' : '#059669',
            },
            {
              label: 'Need Prod.',
              value: `${cards?.stock.needProductionQty ?? 0}`,
              color: '#0D9488',
            },
          ]}
          footerMeta={`${cards?.stock.totalStockQty ?? 0} Total Units • ${cards?.stock.outOfStockCount ?? 0} Out of Stock`}
          exportType="STOCK"
          isDownloading={downloadingType === 'STOCK'}
          onDownload={handleDownload}
          onPress={() => navigation.navigate('StockOverviewDetail')}
        />
      </ScrollView>

      <MonthYearPickerModal
        visible={pickerVisible}
        selectedMonth={selectedMonth}
        onSelect={(val) => {
          setSelectedMonth(val);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  headerDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    maxWidth: 150,
  },
  headerDateText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Combined Master Excel Banner
  masterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  masterIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  masterTextCol: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
  },
  masterSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  masterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 112,
    justifyContent: 'center',
  },
  masterBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },

  // Hero Profit Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
    color: '#64748B',
  },
  heroProfit: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  marginBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  marginBadgeText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  heroMetricItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  heroMetricDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: 10,
  },
  heroMetricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: fontWeight.medium,
  },
  heroMetricValue: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  collectionWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  collectionLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: fontWeight.medium,
  },
  collectionPct: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: fontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },

  // Charts
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: fontWeight.medium,
  },
  barWrap: {
    paddingTop: 4,
    overflow: 'hidden',
  },
  emptyChartText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  donutCenterVal: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
  },
  donutLegendCol: {
    flex: 1,
    gap: 10,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  donutLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  donutLegendLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  donutLegendRight: {
    alignItems: 'flex-end',
  },
  donutLegendAmt: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  donutLegendPct: {
    fontSize: 10,
    color: '#64748B',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    color: '#475569',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // Individual Module Cards
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  moduleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
    flex: 1,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 72,
    justifyContent: 'center',
  },
  excelBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  kpiRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  kpiColDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: 10,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: fontWeight.medium,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: '#0F172A',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  footerMeta: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
