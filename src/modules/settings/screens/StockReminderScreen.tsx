import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing, Minus, Package, Plus, Repeat } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { useBusinessSettings, useUpdateBusinessSettings } from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

const THRESHOLD_PRESETS = [5, 10, 15, 20, 50];
const REPEAT_PRESETS = [1, 2, 3, 7];

function clampInt(val: string, min: number, max: number): number {
  const num = Number.parseInt(val.replace(/\D/g, ''), 10);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function StockReminderScreen() {
  const queryClient = useQueryClient();
  const {
    data: settings,
    isLoading,
    isRefetching,
    refetch,
  } = useBusinessSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateBusinessSettings();

  const [enabled, setEnabled] = useState(true);
  const [thresholdText, setThresholdText] = useState('10');
  const [repeatText, setRepeatText] = useState('1');

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    const cfg = settings?.stockReminderSettings;
    if (!cfg) return;
    setEnabled(cfg.enabled !== undefined ? Boolean(cfg.enabled) : true);
    setThresholdText(String(cfg.lowStockThreshold ?? 10));
    setRepeatText(String(cfg.repeatEveryDays ?? 1));
  }, [settings]);

  const parsedThreshold = useMemo(
    () => clampInt(thresholdText, 0, 100000),
    [thresholdText],
  );
  const parsedRepeatDays = useMemo(
    () => clampInt(repeatText, 1, 90),
    [repeatText],
  );

  const savedCfg = settings?.stockReminderSettings;
  const savedEnabled =
    savedCfg?.enabled !== undefined ? Boolean(savedCfg.enabled) : true;
  const savedThreshold = Number(savedCfg?.lowStockThreshold ?? 10);
  const savedRepeat = Number(savedCfg?.repeatEveryDays ?? 1);

  const hasChanges =
    enabled !== savedEnabled ||
    parsedThreshold !== savedThreshold ||
    parsedRepeatDays !== savedRepeat;

  const adjustValue = (
    current: number,
    delta: number,
    min: number,
    max: number,
    setter: (v: string) => void,
  ) => {
    const next = Math.max(min, Math.min(max, current + delta));
    setter(String(next));
  };

  const handleSave = () => {
    if (isSaving) return;

    updateSettings(
      {
        stockReminderSettings: {
          enabled,
          lowStockThreshold: parsedThreshold,
          repeatEveryDays: parsedRepeatDays,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          popup.success(
            'Saved',
            enabled
              ? `Low stock limit: ${parsedThreshold} units (every ${parsedRepeatDays}d).`
              : `Low stock limit set to ${parsedThreshold} units.`,
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Save Failed',
            axiosErr.response?.data?.message ||
              'Unable to save stock reminder settings.',
          );
        },
      },
    );
  };

  if (isLoading && !settings) {
    return <BusinessSettingsSkeleton />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {/* Toggle Card */}
          <View style={[styles.card, styles.heroCard]}>
            <View style={styles.heroRow}>
              <View
                style={[
                  styles.heroIconBox,
                  enabled ? styles.heroIconActive : styles.heroIconMuted,
                ]}
              >
                <BellRing
                  size={20}
                  color={enabled ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Stock Alerts</Text>
                <Text style={styles.heroSub}>
                  WhatsApp alert when stock is low
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          {/* Threshold Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeIcon}>
                <Package size={16} color={colors.primary} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>Low Stock Limit</Text>
                <Text style={styles.cardHint}>
                  Products at or below this quantity show as Low Stock
                </Text>
              </View>
            </View>

            <View style={styles.presetRow}>
              {THRESHOLD_PRESETS.map((units) => {
                const active = parsedThreshold === units;
                return (
                  <TouchableOpacity
                    key={units}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.75}
                    onPress={() => setThresholdText(String(units))}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {units} Units
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Limit</Text>
              <View style={styles.stepperControl}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustValue(parsedThreshold, -1, 0, 100000, setThresholdText)
                  }
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={thresholdText}
                  onChangeText={(txt) =>
                    setThresholdText(txt.replace(/\D/g, ''))
                  }
                  onBlur={() => setThresholdText(String(parsedThreshold))}
                />
                <Text style={styles.unitLabel}>units</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustValue(parsedThreshold, 1, 0, 100000, setThresholdText)
                  }
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Repeat Frequency Card */}
          <View style={[styles.card, !enabled && styles.cardDimmed]}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeIcon}>
                <Repeat size={16} color={colors.primary} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>Repeat Every</Text>
                <Text style={styles.cardHint}>
                  Alert gap while stock remains low
                </Text>
              </View>
            </View>

            <View style={styles.presetRow}>
              {REPEAT_PRESETS.map((days) => {
                const active = parsedRepeatDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.75}
                    onPress={() => setRepeatText(String(days))}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      Every {days}d
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Repeat Every</Text>
              <View style={styles.stepperControl}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustValue(parsedRepeatDays, -1, 1, 90, setRepeatText)
                  }
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={repeatText}
                  onChangeText={(txt) => setRepeatText(txt.replace(/\D/g, ''))}
                  onBlur={() => setRepeatText(String(parsedRepeatDays))}
                />
                <Text style={styles.unitLabel}>days</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustValue(parsedRepeatDays, 1, 1, 90, setRepeatText)
                  }
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.saveWrap}>
            <AuthButton
              title={hasChanges ? 'Save' : 'Saved'}
              onPress={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroCard: {
    borderColor: colors.primarySoft,
  },
  cardDimmed: {
    opacity: 0.65,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconActive: {
    backgroundColor: colors.primarySoft,
  },
  heroIconMuted: {
    backgroundColor: colors.surfaceSubtle,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  heroSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  cardHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepperLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepInput: {
    minWidth: 46,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingVertical: 2,
  },
  unitLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginRight: 4,
  },
  saveWrap: {
    marginTop: spacing.sm,
  },
});
