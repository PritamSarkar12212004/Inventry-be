import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Building2, Camera } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';

type CompanyLogoPickerProps = {
  logoUri: string | null;
  hint: string;
  onSelectLogo: (uri: string) => void;
};

export function CompanyLogoPicker({
  logoUri,
  hint,
  onSelectLogo,
}: CompanyLogoPickerProps) {
  const handlePickLogo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      onSelectLogo(uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoCircle}
        onPress={handlePickLogo}
        activeOpacity={0.8}
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoImage} />
        ) : (
          <Building2 size={32} color={colors.primary} />
        )}
        <View style={styles.cameraBadge}>
          <Camera size={14} color={colors.textInverse} />
        </View>
      </TouchableOpacity>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
