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
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { tagService } from '@/services/tag.service';
import type { TagDto } from '@/types/resource.types';

interface TagSelectorProps {
  allTags: TagDto[];
  isLoadingTags: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTagCreated: (tag: TagDto) => void;
}

export function TagSelector({ allTags, isLoadingTags, selectedIds, onChange, onTagCreated }: TagSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(
    () => allTags.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())),
    [allTags, search],
  );

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setIsCreating(true);
    try {
      const newTag = await tagService.createTag(trimmed);
      onTagCreated(newTag);
      onChange([...selectedIds, newTag.id]);
      setSearch('');
    } catch {
      Toast.error('Impossible de créer le tag.');
    } finally {
      setIsCreating(false);
    }
  };

  const exactMatch = allTags.some((t) => t.label.toLowerCase() === search.trim().toLowerCase());
  const showCreate = search.trim().length > 0 && !exactMatch;
  const selectedTags = selectedIds.map((id) => allTags.find((t) => t.id === id)).filter(Boolean) as TagDto[];

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>Tags</AppText>

      <Pressable
        style={[styles.trigger, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="pricetags-outline" size={16} color={colors.textMuted} />
        <AppText
          variant="body"
          style={{ flex: 1, marginLeft: Spacing.sm, color: selectedIds.length ? colors.text : colors.placeholder }}
          numberOfLines={1}
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} tag${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`
            : 'Sélectionner des tags…'}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
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
              <AppText variant="h3">Tags</AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher ou créer un tag…"
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
                ListHeaderComponent={showCreate ? (
                  <Pressable
                    style={[styles.createRow, { borderBottomColor: colors.borderLight }]}
                    onPress={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    }
                    <AppText variant="body" style={{ color: colors.primary, marginLeft: Spacing.sm, flex: 1 }}>
                      Créer « {search.trim()} »
                    </AppText>
                  </Pressable>
                ) : null}
                ListEmptyComponent={!showCreate ? (
                  <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                    <AppText variant="body" muted>Aucun tag trouvé</AppText>
                  </View>
                ) : null}
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
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
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
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
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
