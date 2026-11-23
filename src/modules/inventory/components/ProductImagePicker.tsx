import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../../core/theme';
import {
  compressImageUri,
  compressImageUris,
} from '../../../core/util/imageCompressor';
import { INVENTORY_COPY } from '../data';
import { inventoryStyles } from '../styles';

type ProductImagePickerProps = {
  imageUris: string[];
  onChangeImages: (uris: string[]) => void;
};

export function ProductImagePicker({
  imageUris,
  onChangeImages,
}: ProductImagePickerProps) {
  const handlePickGallery = async () => {
    const remaining = Math.max(0, 10 - imageUris.length);
    if (remaining === 0) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      selectionLimit: remaining,
    });

    const picked = (result.assets ?? [])
      .map((a) => a.uri)
      .filter((u): u is string => Boolean(u));

    if (picked.length > 0) {
      const compressed = await compressImageUris(picked);
      onChangeImages([...imageUris, ...compressed].slice(0, 10));
    }
  };

  const handleOpenCamera = async () => {
    if (imageUris.length >= 10) return;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      saveToPhotos: false,
    });

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      const compressed = await compressImageUri(uri);
      onChangeImages([...imageUris, compressed].slice(0, 10));
    }
  };

  const handleRemove = (index: number) => {
    onChangeImages(imageUris.filter((_, idx) => idx !== index));
  };

  return (
    <View>
      <Text style={inventoryStyles.label}>{INVENTORY_COPY.form.imagesLabel}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={inventoryStyles.imagesRow}
      >
        {imageUris.length < 10 ? (
          <>
            <TouchableOpacity
              style={inventoryStyles.addImageBox}
              onPress={handleOpenCamera}
              activeOpacity={0.8}
            >
              <Camera size={22} color={colors.primary} />
              <Text style={inventoryStyles.addImageText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={inventoryStyles.addImageBox}
              onPress={handlePickGallery}
              activeOpacity={0.8}
            >
              <ImagePlus size={22} color={colors.primary} />
              <Text style={inventoryStyles.addImageText}>Gallery</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {imageUris.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={inventoryStyles.thumbWrap}>
            <Image source={{ uri }} style={inventoryStyles.thumbImage} />
            <TouchableOpacity
              style={inventoryStyles.removeImageBtn}
              onPress={() => handleRemove(idx)}
            >
              <X size={12} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
