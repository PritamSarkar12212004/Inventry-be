import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { popup, usePopupStore, type PopupType } from '../store/popupStore';
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../theme';

function PopupIcon({ type }: { type: PopupType }) {
  if (type === 'success') {
    return (
      <View style={[styles.iconWrap, styles.successBg]}>
        <CheckCircle2 size={24} color={colors.success} />
      </View>
    );
  }
  if (type === 'error') {
    return (
      <View style={[styles.iconWrap, styles.errorBg]}>
        <AlertCircle size={24} color={colors.danger} />
      </View>
    );
  }
  return (
    <View style={[styles.iconWrap, styles.infoBg]}>
      <Info size={24} color={colors.primary} />
    </View>
  );
}

export function IosPopupHost() {
  const { visible, type, title, message, confirmText } = usePopupStore();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.92);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }).start();
    }
  }, [visible, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={popup.hide}
    >
      <Pressable style={styles.backdrop} onPress={popup.hide}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.body}>
            <PopupIcon type={type} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={popup.hide}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{confirmText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 356,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.floating,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successBg: {
    backgroundColor: colors.successBg,
  },
  errorBg: {
    backgroundColor: colors.dangerBg,
  },
  infoBg: {
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  actionBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
