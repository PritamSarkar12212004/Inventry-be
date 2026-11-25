import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import codePush from '@revopush/react-native-code-push';
import { DownloadCloud, RefreshCw, Sparkles, X } from 'lucide-react-native';
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../theme';

type UpdateUiState = 'hidden' | 'downloading' | 'installing' | 'ready';

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

export function CodePushUpdater() {
  const [uiState, setUiState] = useState<UpdateUiState>('hidden');
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const syncingRef = useRef(false);

  const checkAndSync = useCallback(async () => {
    if (__DEV__ || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const pending = await codePush.getUpdateMetadata(
        codePush.UpdateState.PENDING,
      );
      if (pending) {
        setUiState('ready');
        return;
      }

      await codePush.sync(
        {
          installMode: codePush.InstallMode.ON_NEXT_RESTART,
          mandatoryInstallMode: codePush.InstallMode.ON_NEXT_RESTART,
        },
        (status) => {
          switch (status) {
            case codePush.SyncStatus.DOWNLOADING_PACKAGE:
              setUiState('downloading');
              break;
            case codePush.SyncStatus.INSTALLING_UPDATE:
              setUiState('installing');
              break;
            case codePush.SyncStatus.UPDATE_INSTALLED:
              setUiState('ready');
              break;
            case codePush.SyncStatus.UP_TO_DATE:
            case codePush.SyncStatus.UPDATE_IGNORED:
            case codePush.SyncStatus.UNKNOWN_ERROR:
              setUiState((prev) => (prev === 'ready' ? 'ready' : 'hidden'));
              break;
            default:
              break;
          }
        },
        (progress) => {
          setReceivedBytes(progress.receivedBytes);
          setTotalBytes(progress.totalBytes);
        },
      );
    } catch {
      setUiState((prev) => (prev === 'ready' ? 'ready' : 'hidden'));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void checkAndSync();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkAndSync();
      }
    });

    return () => {
      sub.remove();
    };
  }, [checkAndSync]);

  const handleRestart = () => {
    codePush.restartApp();
  };

  if (uiState === 'hidden') return null;

  const progressPct =
    totalBytes > 0
      ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
      : 0;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (uiState === 'ready') setUiState('hidden');
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {uiState === 'ready' ? (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setUiState('hidden')}
              hitSlop={8}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}

          <View
            style={[
              styles.iconCircle,
              uiState === 'ready' && styles.iconCircleReady,
            ]}
          >
            {uiState === 'ready' ? (
              <Sparkles size={24} color={colors.success} />
            ) : (
              <DownloadCloud size={24} color={colors.primary} />
            )}
          </View>

          <Text style={styles.title}>
            {uiState === 'downloading'
              ? 'Update Available'
              : uiState === 'installing'
                ? 'Installing Update'
                : 'Update Ready'}
          </Text>

          <Text style={styles.subtitle}>
            {uiState === 'downloading'
              ? 'Downloading the latest app update in the background...'
              : uiState === 'installing'
                ? 'Applying update files. Please wait a moment...'
                : 'A new update has been downloaded and installed. Restart the app to apply changes.'}
          </Text>

          {uiState === 'downloading' ? (
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.progressText}>{progressPct}%</Text>
                {totalBytes > 0 ? (
                  <Text style={styles.progressText}>
                    {formatMb(receivedBytes)} / {formatMb(totalBytes)} MB
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {uiState === 'installing' ? (
            <View style={styles.installingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.installingText}>Finalizing update...</Text>
            </View>
          ) : null}

          {uiState === 'ready' ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={() => setUiState('hidden')}
                activeOpacity={0.75}
              >
                <Text style={styles.laterBtnText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restartBtn}
                onPress={handleRestart}
                activeOpacity={0.8}
              >
                <RefreshCw size={16} color={colors.surface} />
                <Text style={styles.restartBtnText}>Restart Now</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleReady: {
    backgroundColor: '#ECFDF5',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  progressSection: {
    width: '100%',
    marginTop: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  installingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  installingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xl,
  },
  laterBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  restartBtn: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
});
