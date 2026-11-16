import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../core/navigation/types';
import { commonStyles } from '../../../core/theme';
import { Authstyles } from '../styles';
import { ScreenWrapper } from '../../../core/layouts/ScreenWrapper';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

export function PhoneLoginScreen({ navigation }: Props) {
  return (
    <ScreenWrapper style={commonStyles.screen} edges={['top', 'bottom']}>
      <View style={Authstyles.container}>
        <Text>hello</Text>
      </View>
    </ScreenWrapper>
  );
}
