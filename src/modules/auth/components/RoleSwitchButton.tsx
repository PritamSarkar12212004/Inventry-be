import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Smartphone, User } from 'lucide-react-native';
import { colors } from '../../../core/theme';
import { AUTH_COPY } from '../data';
import { authStyles } from '../styles';

type RoleSwitchButtonProps = {
  role: 'admin' | 'employee';
  onPress: () => void;
  disabled?: boolean;
};

export function RoleSwitchButton({
  role,
  onPress,
  disabled = false,
}: RoleSwitchButtonProps) {
  const isAdmin = role === 'admin';

  return (
    <TouchableOpacity
      style={[authStyles.switchModeBtn, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {isAdmin ? (
        <User size={16} color={colors.primary} />
      ) : (
        <Smartphone size={16} color={colors.primary} />
      )}
      <Text style={authStyles.switchModeText}>
        {isAdmin ? AUTH_COPY.admin.switchLabel : AUTH_COPY.employee.switchLabel}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
