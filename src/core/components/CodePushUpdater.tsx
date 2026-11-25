import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import codePush, {
  type DownloadProgress,
} from '@revopush/react-native-code-push';
import { CloudDownload, RefreshCw, Rocket, RotateCw } from 'lucide-react-native';

type UpdatePhase = 'hidden' | 'downloading' | 'installing' | 'ready';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CodePushUpdater() {
  const [phase, setPhase] = useState<UpdatePhase>('hidden');
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const isSyncingRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'hidden') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulseAnim]);

  const runSync = useCallback(async () => {
    if (__DEV__ || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const pending = await codePush.getUpdateMetadata(
        codePush.UpdateState.PENDING,
      );
      if (pending) {
        setPhase('ready');
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
              setPhase('downloading');
              break;
            case codePush.SyncStatus.INSTALLING_UPDATE:
              setPhase('installing');
              break;
            case codePush.SyncStatus.UPDATE_INSTALLED:
              setPhase('ready');
              break;
            case codePush.SyncStatus.UP_TO_DATE:
            case codePush.SyncStatus.UPDATE_IGNORED:
            case codePush.SyncStatus.UNKNOWN_ERROR:
              setPhase((prev) => (prev === 'ready' ? 'ready' : 'hidden'));
              break;
            default:
              break;
          }
        },
        (progress: DownloadProgress) => {
          setReceivedBytes(progress.receivedBytes || 0);
          setTotalBytes(progress.totalBytes || 0);
        },
      );
    } catch {
      setPhase((prev) => (prev === 'ready' ? 'ready' : 'hidden'));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void runSync();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void runSync();
      }
    });
    return () => sub.remove();
  }, [runSync]);

  const handleRestart = useCallback(() => {
    if (isRestarting) return;
    setIsRestarting(true);
    codePush.restartApp(false);
  }, [isRestarting]);

  if (phase === 'hidden') {
    return null;
  }

  const progressPct =
    phase === 'installing' || phase === 'ready'
      ? 100
      : totalBytes > 0
        ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
        : 0;

  const isReady = phase === 'ready';
  const isInstalling = phase === 'installing';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.topSection}>
            {/* Top Accent Pill */}
            <View
              style={[
                styles.statusPill,
                isReady ? styles.statusPillSuccess : styles.statusPillInfo,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isReady ? '#059669' : '#4F46E5' },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isReady ? '#047857' : '#4338CA' },
                ]}
              >
                {isReady
                  ? 'UPDATE INSTALLED'
                  : isInstalling
                    ? 'INSTALLING UPDATE'
                    : 'NEW UPDATE AVAILABLE'}
              </Text>
            </View>

            {/* Animated Hero Icon */}
            <Animated.View
              style={[
                styles.iconRing,
                isReady ? styles.iconRingSuccess : styles.iconRingInfo,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View
                style={[
                  styles.iconInner,
                  isReady ? styles.iconInnerSuccess : styles.iconInnerInfo,
                ]}
              >
                {isReady ? (
                  <Rocket size={34} color="#FFFFFF" />
                ) : isInstalling ? (
                  <RefreshCw size={34} color="#FFFFFF" />
                ) : (
                  <CloudDownload size={34} color="#FFFFFF" />
                )}
              </View>
            </Animated.View>

            {/* Title & Description */}
            <Text style={styles.title}>
              {isReady
                ? 'Update Ready to Apply'
                : isInstalling
                  ? 'Preparing Your App...'
                  : 'Downloading Update'}
            </Text>
            <Text style={styles.subtitle}>
              {isReady
                ? 'New improvements and bug fixes have been downloaded. Restart Inventory App now to start using the latest version.'
                : isInstalling
                  ? 'Almost done! Applying the latest update package to your app.'
                  : 'A new update is available for Inventory App. Please wait while we download the latest version.'}
            </Text>
          </View>

          {/* Progress Section */}
          {!isReady ? (
            <View style={styles.progressBox}>
              <View style={styles.progressHeader}>
                <View style={styles.progressLabelRow}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.progressLabel}>
                    {isInstalling ? 'Installing...' : 'Downloading...'}
                  </Text>
                </View>
                <Text style={styles.progressPercent}>{progressPct}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>

              {totalBytes > 0 ? (
                <Text style={styles.bytesText}>
                  {formatBytes(receivedBytes)} / {formatBytes(totalBytes)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Restart Button Only (No Later option) */}
          {isReady ? (
            <View style={styles.actionsWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isRestarting}
                onPress={handleRestart}
                style={styles.restartBtn}
              >
                {isRestarting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <RotateCw size={20} color="#FFFFFF" />
                    <Text style={styles.restartBtnText}>Restart App Now</Text>
                  </>
                )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    minHeight: 410,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusPillInfo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  statusPillSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconRingInfo: {
    backgroundColor: '#EEF2FF',
  },
  iconRingSuccess: {
    backgroundColor: '#ECFDF5',
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  iconInnerInfo: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
  },
  iconInnerSuccess: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  progressBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  bytesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
  },
  actionsWrap: {
    width: '100%',
    paddingTop: 8,
  },
  restartBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});
