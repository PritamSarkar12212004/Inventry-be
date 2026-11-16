import React, { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { colors } from '../../../core/theme';
import { profileStyles } from '../styles';

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  leftIcon?: React.ReactNode;
};

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  leftIcon,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={profileStyles.inputWrapper}>
      <Text style={profileStyles.inputLabel}>{label}</Text>
      <View
        style={[
          profileStyles.inputRow,
          focused && profileStyles.inputFocused,
          !editable && profileStyles.inputReadonly,
        ]}
      >
        {leftIcon ? (
          <View style={profileStyles.inputIconBox}>{leftIcon}</View>
        ) : null}
        <TextInput
          style={[
            profileStyles.inputField,
            !editable && profileStyles.readonlyText,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}
