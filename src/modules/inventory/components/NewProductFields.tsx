import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../core/theme';
import { INVENTORY_COPY } from '../data';
import { inventoryStyles } from '../styles';
import { CategoryPickerModal } from './CategoryPickerModal';
import { ProductImagePicker } from './ProductImagePicker';

type NewProductFieldsProps = {
  name: string;
  category: string;
  imageUris: string[];
  onChangeName: (name: string) => void;
  onChangeCategory: (category: string) => void;
  onChangeImages: (uris: string[]) => void;
};

export function NewProductFields({
  name,
  category,
  imageUris,
  onChangeName,
  onChangeCategory,
  onChangeImages,
}: NewProductFieldsProps) {
  return (
    <View>
      <Text style={inventoryStyles.label}>
        {INVENTORY_COPY.form.customNameLabel}
      </Text>
      <TextInput
        style={inventoryStyles.textInput}
        placeholder={INVENTORY_COPY.form.customNamePlaceholder}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={onChangeName}
      />

      <CategoryPickerModal
        selectedCategory={category}
        onSelectCategory={onChangeCategory}
      />

      <ProductImagePicker imageUris={imageUris} onChangeImages={onChangeImages} />
    </View>
  );
}
