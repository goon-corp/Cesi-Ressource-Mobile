import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import type { TagDto } from '@/types/resource.types';

interface TagFilterProps {
  allTags: TagDto[];
  isLoadingTags: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagFilter({ allTags, isLoadingTags, selectedIds, onChange }: TagFilterProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => allTags.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())),
    [allTags, search],
  );

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]);
  };

  const selectedTags = selectedIds.map((id) => allTags.find((t) => t.id === id)).filter(Boolean) as TagDto[];
  const hasFilter = selectedIds.length > 0;

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            borderColor: hasFilter ? colors.primary : colors.inputBorder,
            backgroundColor: hasFilter ? colors.primaryLight : colors.inputBackground,
          },
        ]}
      >
        <Ionicons name="pricetags-outline" size={16} color={hasFilter ? colors.primary : colors.textMuted} />
        <AppText
          variant="label"
          style={{ color: hasFilter ? colors.primary : colors.textMuted, marginLeft: Spacing.xs }}
          numberOfLines={1}
        >
          {hasFilter ? `${selectedIds.length} tag${selectedIds.length > 1 ? 's' : ''}` : 'Tags'}
        </AppText>
        {hasFilter
          ? (
            <Pressable onPress={() => onChange([])} hitSlop={8} style={{ marginLeft: Spacing.xs }}>
              <Ionicons name="close-circle" size={14} color={colors.primary} />
            </Pressable>
          )
          : <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: Spacing.xs }} />
        }
      </Pressable>

      {selectedTags.length > 0 && (
        <View style={styles.chips}>
          {selectedTags.map((tag) => (
            <Pressable
              key={tag.id}
              style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={() => toggle(tag.id)}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>{tag.label}</AppText>
              <Ionicons name="close" size={11} color={colors.primary} style={{ marginLeft: 3 }} />
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.borderLight }]}>
              <AppText variant="h3">Filtrer par tag</AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher un tag…"
                placeholderTextColor={colors.placeholder}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {isLoadingTags ? (
              <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(t) => t.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                    <AppText variant="body" muted>Aucun tag trouvé</AppText>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <Pressable
                      style={[
                        styles.tagRow,
                        { borderBottomColor: colors.borderLight },
                        isSelected && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => toggle(item.id)}
                    >
                      <AppText variant="body" style={{ flex: 1, color: isSelected ? colors.primary : colors.text }}>
                        {item.label}
                      </AppText>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    margin: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 52,
  },
});
