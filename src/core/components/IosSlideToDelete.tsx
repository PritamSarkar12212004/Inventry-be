import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronsRight, Trash2 } from 'lucide-react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { IosLoader } from './IosLoader';

type IosSlideToDeleteProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
};

const TRACK_HEIGHT = 54;
const THUMB_SIZE = 46;
const TRACK_PADDING = 4;

export function IosSlideToDelete({
  label = 'Slide to Delete Product',
  loading = false,
  disabled = false,
  onConfirm,
}: IosSlideToDeleteProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const maxSlide = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PADDING * 2);

  useEffect(() => {
    if (!loading) {
      slideX.setValue(0);
    }
  }, [loading, slideX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          !disabled && !loading && maxSlide > 0,
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          !disabled &&
          !loading &&
          maxSlide > 0 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, gesture) => {
          const clamped = Math.max(0, Math.min(gesture.dx, maxSlide));
          slideX.setValue(clamped);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dx >= maxSlide * 0.72) {
            Animated.timing(slideX, {
              toValue: maxSlide,
              duration: 100,
              useNativeDriver: false,
            }).start(() => {
              onConfirmRef.current();
            });
          } else {
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: false,
              bounciness: 6,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        },
      }),
    [disabled, loading, maxSlide, slideX],
  );

  const fillWidth = slideX.interpolate({
    inputRange: [0, Math.max(maxSlide, 1)],
    outputRange: [THUMB_SIZE + TRACK_PADDING * 2, Math.max(trackWidth, THUMB_SIZE + TRACK_PADDING * 2)],
    extrapolate: 'clamp',
  });

  const textOpacity =
    maxSlide > 0
      ? slideX.interpolate({
          inputRange: [0, maxSlide * 0.55],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        })
      : 1;

  return (
    <View
      style={[styles.track, (disabled || loading) && styles.disabled]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {/* Dark red progress fill behind thumb */}
      {trackWidth > 0 ? (
        <Animated.View style={[styles.progressFill, { width: fillWidth }]} />
      ) : null}

      <Animated.View style={[styles.labelWrap, { opacity: textOpacity }]}>
        {loading ? (
          <IosLoader size={20} color={colors.danger} />
        ) : (
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>{label}</Text>
            <ChevronsRight size={16} color={colors.danger} />
          </View>
        )}
      </Animated.View>

      {!loading ? (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.thumb, { transform: [{ translateX: slideX }] }]}
        >
          <Trash2 size={18} color={colors.textInverse} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    justifyContent: 'center',
    padding: TRACK_PADDING,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.75,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#991B1B',
    borderRadius: radius.full,
  },
  labelWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: THUMB_SIZE / 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
