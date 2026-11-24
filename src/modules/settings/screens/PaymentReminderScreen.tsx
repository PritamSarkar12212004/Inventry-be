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
import {
  BellRing,
  CalendarClock,
  Clock,
  Minus,
  Plus,
  Repeat,
} from 'lucide-react-native';
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

const GRACE_PRESETS = [3, 7, 15, 30];
const REPEAT_PRESETS = [1, 2, 3, 7];

function clampInt(val: string, min: number, max: number): number {
  const num = Number.parseInt(val.replace(/\D/g, ''), 10);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function PaymentReminderScreen() {
  const {
    data: settings,
    isLoading,
    isRefetching,
    refetch,
  } = useBusinessSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateBusinessSettings();

  const [enabled, setEnabled] = useState(false);
  const [firstReminderDays, setFirstReminderDays] = useState('7');
  const [repeatEveryDays, setRepeatEveryDays] = useState('3');

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    const cfg = settings?.paymentReminderSettings;
    if (!cfg) return;
    setEnabled(Boolean(cfg.enabled));
    setFirstReminderDays(String(cfg.firstReminderDays ?? 7));
    setRepeatEveryDays(String(cfg.repeatEveryDays ?? 3));
  }, [settings]);

  const parsedFirstDays = useMemo(
    () => clampInt(firstReminderDays, 1, 365),
    [firstReminderDays],
  );
  const parsedRepeatDays = useMemo(
    () => clampInt(repeatEveryDays, 1, 90),
    [repeatEveryDays],
  );

  const savedCfg = settings?.paymentReminderSettings;
  const hasChanges =
    enabled !== Boolean(savedCfg?.enabled) ||
    parsedFirstDays !== (savedCfg?.firstReminderDays ?? 7) ||
    parsedRepeatDays !== (savedCfg?.repeatEveryDays ?? 3);

  const adjustDays = (
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
        paymentReminderSettings: {
          enabled,
          firstReminderDays: parsedFirstDays,
          repeatEveryDays: parsedRepeatDays,
        },
      },
      {
        onSuccess: () => {
          popup.success(
            'Saved',
            enabled
              ? `Payment reminders active: first after ${parsedFirstDays}d, then every ${parsedRepeatDays}d.`
              : 'Auto payment reminders paused.',
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Save Failed',
            axiosErr.response?.data?.message ||
              'Unable to save reminder settings.',
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
          {/* Master Toggle Card */}
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
                <Text style={styles.heroTitle}>Auto Reminders</Text>
                <Text style={styles.heroSub}>
                  WhatsApp alerts for unpaid bills
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

          {/* 1. Grace Period (First Reminder) */}
          <View style={[styles.card, !enabled && styles.cardDimmed]}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeIcon}>
                <Clock size={16} color={colors.primary} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>First Reminder</Text>
                <Text style={styles.cardHint}>Days after bill date</Text>
              </View>
            </View>

            <View style={styles.presetRow}>
              {GRACE_PRESETS.map((days) => {
                const active = parsedFirstDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.75}
                    onPress={() => setFirstReminderDays(String(days))}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {days} Days
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Custom Days</Text>
              <View style={styles.stepperControl}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustDays(parsedFirstDays, -1, 1, 365, setFirstReminderDays)
                  }
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={firstReminderDays}
                  onChangeText={(txt) =>
                    setFirstReminderDays(txt.replace(/\D/g, ''))
                  }
                  onBlur={() => setFirstReminderDays(String(parsedFirstDays))}
                />
                <Text style={styles.unitLabel}>days</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustDays(parsedFirstDays, 1, 1, 365, setFirstReminderDays)
                  }
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2. Follow-up Frequency */}
          <View style={[styles.card, !enabled && styles.cardDimmed]}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeIcon}>
                <Repeat size={16} color={colors.primary} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>Repeat Every</Text>
                <Text style={styles.cardHint}>Follow-up gap until paid</Text>
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
                    onPress={() => setRepeatEveryDays(String(days))}
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
                    adjustDays(parsedRepeatDays, -1, 1, 90, setRepeatEveryDays)
                  }
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={repeatEveryDays}
                  onChangeText={(txt) =>
                    setRepeatEveryDays(txt.replace(/\D/g, ''))
                  }
                  onBlur={() => setRepeatEveryDays(String(parsedRepeatDays))}
                />
                <Text style={styles.unitLabel}>days</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    adjustDays(parsedRepeatDays, 1, 1, 90, setRepeatEveryDays)
                  }
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Live Schedule Preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <CalendarClock size={16} color={colors.primary} />
              <Text style={styles.previewTitle}>Schedule</Text>
            </View>

            <View style={styles.timeline}>
              <View style={styles.timelineRow}>
                <View style={styles.dotMuted} />
                <Text style={styles.timelineText}>
                  <Text style={styles.timelineBold}>Day 0 — </Text>
                  Bill created
                </Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={styles.dotPrimary} />
                <Text style={styles.timelineText}>
                  <Text style={styles.timelineBold}>
                    Day {parsedFirstDays} —{' '}
                  </Text>
                  1st reminder
                </Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={styles.dotPrimary} />
                <Text style={styles.timelineText}>
                  <Text style={styles.timelineBold}>
                    Every {parsedRepeatDays}d —{' '}
                  </Text>
                  Repeat until paid
                </Text>
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
    lineHeight: 17,
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
    marginTop: 3,
    lineHeight: 17,
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
    minWidth: 42,
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
  previewCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  timeline: {
    gap: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotMuted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dotPrimary: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timelineText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  timelineBold: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  saveWrap: {
    marginTop: spacing.sm,
  },
});
