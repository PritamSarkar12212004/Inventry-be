import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileStyles } from '../styles';

type ProfileHeaderProps = {
  title: string;
  subtitle: string;
  includeTopSafeArea?: boolean;
};

export function ProfileHeader({
  title,
  subtitle,
  includeTopSafeArea = true,
}: ProfileHeaderProps) {
  const Container = includeTopSafeArea ? SafeAreaView : View;
  return (
    <Container
      {...(includeTopSafeArea ? { edges: ['top'] as const } : {})}
      style={profileStyles.headerSafe}
    >
      <View style={profileStyles.headerContainer}>
        <View style={profileStyles.headerTextWrap}>
          <Text style={profileStyles.headerTitle}>{title}</Text>
          <Text style={profileStyles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Container>
  );
}
