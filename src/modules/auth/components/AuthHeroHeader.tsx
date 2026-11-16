import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../styles';

type AuthHeroHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeroHeader({ title, subtitle }: AuthHeroHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={authStyles.heroSafe}>
      <View style={authStyles.hero}>
        <Text style={authStyles.heroTitle}>{title}</Text>
        <Text style={authStyles.heroSubtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}
