import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_ORIGIN } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosConfirmModal } from '../../../core/components/IosConfirmModal';
import { IosLoader } from '../../../core/components/IosLoader';
import { IosSlideToDelete } from '../../../core/components/IosSlideToDelete';
import { popup } from '../../../core/store/popupStore';
import { colors, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { NewProductFields } from '../components';
import {
  useDeleteProduct,
  useProductDetail,
  useUpdateProductBasicDetails,
} from '../hooks';
import { inventoryStyles } from '../styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

type ExistingImageEntry = {
  id: string | null;
  uri: string;
};

export function ProductFormScreen({ route, navigation }: Props) {
  const productId = route.params?.productId ?? '';
  const { data: product, isLoading } = useProductDetail(productId);
  const { mutate: updateProduct, isPending: isSaving } =
    useUpdateProductBasicDetails();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const isBusy = isSaving || isDeleting;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [initialImages, setInitialImages] = useState<ExistingImageEntry[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    if (product && !initialized) {
      setName(product.name || '');
      setCategory(product.category || 'General');

      const mapped: ExistingImageEntry[] = (product.images ?? [])
        .map((img) => {
          const rawUrl = typeof img === 'string' ? img : img?.url;
          const id = typeof img === 'string' ? null : img?._id ?? null;
          if (!rawUrl) return null;
          const fullUri = rawUrl.startsWith('http')
            ? rawUrl
            : `${API_ORIGIN}${rawUrl}`;
          return { id, uri: fullUri };
        })
        .filter((item): item is ExistingImageEntry => Boolean(item));

      setInitialImages(mapped);
      setImageUris(mapped.map((m) => m.uri));
      setInitialized(true);
    }
  }, [product, initialized]);

  const handleSave = () => {
    if (isBusy || !productId || !product) return;

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    if (trimmedName.length < 1) {
      popup.error('Invalid Input', 'Product name cannot be empty.');
      return;
    }
    if (trimmedCategory.length < 1) {
      popup.error('Invalid Input', 'Category cannot be empty.');
      return;
    }
    if (imageUris.length < 1) {
      popup.error('Image Required', 'At least 1 product image is required.');
      return;
    }

    const nameChanged = trimmedName !== (product.name || '').trim();
    const categoryChanged =
      trimmedCategory !== (product.category || 'General').trim();

    const keptSet = new Set(imageUris);
    const removedImageIds = initialImages
      .filter((img) => !keptSet.has(img.uri) && img.id)
      .map((img) => img.id as string);

    const initialSet = new Set(initialImages.map((img) => img.uri));
    const newImageUris = imageUris.filter((uri) => !initialSet.has(uri));

    if (
      !nameChanged &&
      !categoryChanged &&
      removedImageIds.length === 0 &&
      newImageUris.length === 0
    ) {
      navigation.goBack();
      return;
    }

    updateProduct(
      {
        productId,
        ...(nameChanged ? { name: trimmedName } : {}),
        ...(categoryChanged ? { category: trimmedCategory } : {}),
        removedImageIds,
        newImageUris,
      },
      {
        onSuccess: () => {
          popup.success('Updated', 'Product details updated successfully.');
          navigation.goBack();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          popup.error(
            'Update Failed',
            axiosErr.response?.data?.message || 'Could not update product.',
          );
        },
      },
    );
  };

  const handleDelete = () => {
    if (isBusy || !productId) return;

    deleteProduct(productId, {
      onSuccess: () => {
        setConfirmDeleteVisible(false);
        popup.success('Deleted', 'Product deleted successfully.');
        navigation.popToTop();
      },
      onError: (err) => {
        setConfirmDeleteVisible(false);
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        popup.error(
          'Delete Failed',
          axiosErr.response?.data?.message || 'Could not delete product.',
        );
      },
    });
  };

  if (isLoading || !initialized) {
    return (
      <View style={inventoryStyles.centerBox}>
        <IosLoader size={28} color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={inventoryStyles.formScreen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={inventoryStyles.formScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={inventoryStyles.formScroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <NewProductFields
            name={name}
            category={category}
            imageUris={imageUris}
            onChangeName={setName}
            onChangeCategory={setCategory}
            onChangeImages={setImageUris}
          />

          <View style={[inventoryStyles.formFooter, { gap: spacing.md }]}>
            <AuthButton
              title="Save Changes"
              onPress={handleSave}
              disabled={isDeleting}
              loading={isSaving}
            />

            <IosSlideToDelete
              onConfirm={() => setConfirmDeleteVisible(true)}
              loading={isDeleting}
              disabled={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <IosConfirmModal
        visible={confirmDeleteVisible}
        title="Delete Product?"
        message={`Are you sure you want to delete "${name.trim() || 'this product'}"? It will be removed from your inventory list.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </SafeAreaView>
  );
}
