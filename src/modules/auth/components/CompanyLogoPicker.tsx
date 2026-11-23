import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Building2, Camera } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../../core/theme';
import { compressImageUri } from '../../../core/util/imageCompressor';
import { profileStyles } from '../styles';

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
      maxWidth: 1200,
      maxHeight: 1200,
      selectionLimit: 1,
    });

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      const compressed = await compressImageUri(uri);
      onSelectLogo(compressed);
    }
  };

  return (
    <View style={profileStyles.logoContainer}>
      <TouchableOpacity
        style={profileStyles.logoCircle}
        onPress={handlePickLogo}
        activeOpacity={0.8}
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={profileStyles.logoImage} />
        ) : (
          <Building2 size={32} color={colors.primary} />
        )}
        <View style={profileStyles.cameraBadge}>
          <Camera size={14} color={colors.textInverse} />
        </View>
      </TouchableOpacity>
      <Text style={profileStyles.logoHint}>{hint}</Text>
    </View>
  );
}
