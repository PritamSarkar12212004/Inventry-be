import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../core/theme';
import { AUTH_COPY } from '../data';
import { authStyles } from '../styles';

type AdminPhoneFormProps = {
  phone: string;
  onChangePhone: (value: string) => void;
};

export function AdminPhoneForm({ phone, onChangePhone }: AdminPhoneFormProps) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <Text style={authStyles.label}>{AUTH_COPY.admin.phoneLabel}</Text>
      <View
        style={[authStyles.inputRow, focused && authStyles.inputRowFocused]}
      >
        <View style={authStyles.countryPrefix}>
          <Text style={authStyles.prefixText}>
            {AUTH_COPY.admin.countryCode}
          </Text>
        </View>
        <TextInput
          style={authStyles.flexInput}
          placeholder={AUTH_COPY.admin.phonePlaceholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={onChangePhone}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <Text style={authStyles.helperText}>{AUTH_COPY.admin.phoneHelper}</Text>
    </>
  );
}
