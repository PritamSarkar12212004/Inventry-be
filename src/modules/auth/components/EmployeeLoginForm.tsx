import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { colors } from '../../../core/theme';
import { AUTH_COPY } from '../data';
import { authStyles } from '../styles';

type EmployeeLoginFormProps = {
  userId: string;
  password: string;
  onChangeUserId: (value: string) => void;
  onChangePassword: (value: string) => void;
};

export function EmployeeLoginForm({
  userId,
  password,
  onChangeUserId,
  onChangePassword,
}: EmployeeLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'userId' | 'password' | null>(
    null,
  );

  return (
    <>
      <Text style={authStyles.label}>{AUTH_COPY.employee.userIdLabel}</Text>
      <View
        style={[
          authStyles.inputRow,
          focusedField === 'userId' && authStyles.inputRowFocused,
        ]}
      >
        <User
          size={18}
          color={focusedField === 'userId' ? colors.primary : colors.textMuted}
          style={authStyles.inputIcon}
        />
        <TextInput
          style={authStyles.flexInput}
          placeholder={AUTH_COPY.employee.userIdPlaceholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={userId}
          onChangeText={onChangeUserId}
          onFocus={() => setFocusedField('userId')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <Text style={[authStyles.label, authStyles.topGap]}>
        {AUTH_COPY.employee.passwordLabel}
      </Text>
      <View
        style={[
          authStyles.inputRow,
          focusedField === 'password' && authStyles.inputRowFocused,
        ]}
      >
        <Lock
          size={18}
          color={
            focusedField === 'password' ? colors.primary : colors.textMuted
          }
          style={authStyles.inputIcon}
        />
        <TextInput
          style={authStyles.flexInput}
          placeholder={AUTH_COPY.employee.passwordPlaceholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={onChangePassword}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={authStyles.eyeBtn}
        >
          {showPassword ? (
            <EyeOff size={18} color={colors.textSecondary} />
          ) : (
            <Eye size={18} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}
