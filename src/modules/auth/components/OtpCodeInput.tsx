import React, { type ComponentRef, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { authStyles } from '../styles';

type OtpCodeInputProps = {
  code: string;
  length?: number;
  onChangeCode: (value: string) => void;
};

export function OtpCodeInput({
  code,
  length = 6,
  onChangeCode,
}: OtpCodeInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, length);
    onChangeCode(digitsOnly);
  };

  return (
    <Pressable
      style={authStyles.otpContainer}
      onPress={() => inputRef.current?.focus()}
    >
      <TextInput
        ref={inputRef}
        style={authStyles.otpHiddenInput}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        caretHidden
        selectionColor="transparent"
        underlineColorAndroid="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <View style={authStyles.otpBoxesRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = code[index] ?? '';
          const isCurrent = focused && index === Math.min(code.length, length - 1);

          return (
            <View
              key={index}
              style={[
                authStyles.otpBox,
                digit ? authStyles.otpBoxFilled : null,
                isCurrent ? authStyles.otpBoxActive : null,
              ]}
            >
              {digit ? (
                <Text style={authStyles.otpDigit}>{digit}</Text>
              ) : isCurrent ? (
                <View style={authStyles.otpCursor} />
              ) : null}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
