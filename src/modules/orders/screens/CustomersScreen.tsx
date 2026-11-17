import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AxiosError } from 'axios';
import { Phone, Plus, Search, User, Users, X } from 'lucide-react-native';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { inventoryStyles } from '../../inventory/styles';
import { useCreateCustomer, useInfiniteCustomers } from '../hooks';
import type { CustomerItem } from '../types';

export function CustomersScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCustomers(debouncedSearch || undefined);

  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();

  const customers = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      popup.error('Required', 'Customer name is required.');
      return;
    }

    createCustomer(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        billingAddress: address.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setPhone('');
          setAddress('');
          setModalVisible(false);
          popup.success('Customer Added', 'Customer saved successfully.');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Error',
            axiosErr.response?.data?.message || 'Unable to add customer.',
          );
        },
      },
    );
  };

  const renderCustomer = ({ item }: { item: CustomerItem }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <User size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.phoneRow}>
          <Phone size={12} color={colors.textSecondary} />
          <Text style={styles.phone}>{item.phone || 'No phone'}</Text>
        </View>
        {item.billingAddress || item.address ? (
          <Text style={styles.address} numberOfLines={1}>
            {item.billingAddress || item.address}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
        <View style={inventoryStyles.searchBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={inventoryStyles.searchInput}
            placeholder="Search customer name or phone..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={inventoryStyles.centerBox}>
          <IosLoader size={28} color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={inventoryStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={renderCustomer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={inventoryStyles.listFooterLoader}>
                <IosLoader size={20} color={colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={inventoryStyles.centerBox}>
              <Users size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>No customers yet</Text>
              <Text style={inventoryStyles.emptySubtitle}>
                Customers are added automatically on sale or via + Add Customer.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={inventoryStyles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Plus size={18} color={colors.textInverse} />
        <Text style={inventoryStyles.fabText}>Add Customer</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Customer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Aarav Enterprises"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Phone / WhatsApp Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="City, Shop or Address"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.modalBtnWrap}>
              <AuthButton
                title="Save Customer"
                onPress={handleCreate}
                loading={isCreating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phone: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  address: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  modalBtnWrap: {
    marginTop: spacing.lg,
  },
});
