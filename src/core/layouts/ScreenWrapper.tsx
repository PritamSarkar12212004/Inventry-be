import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';
import { commonStyles } from '../theme';

type ScreenWrapperProps = {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenWrapper({
  children,
  edges = ['top', 'bottom'],
  scrollable = false,
  keyboardAvoiding = true,
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[commonStyles.screen, style]} edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={commonStyles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
