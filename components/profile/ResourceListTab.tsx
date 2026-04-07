import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ResourceCard, type ResourceCardActionsMode } from '@/components/ui/ResourceCard';
import { TagFilter } from '@/components/ui/TagFilter';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { tagService } from '@/services/tag.service';
import type { ApiResource, PaginatedListDto, TagDto } from '@/types/resource.types';

const ALL_SIZE = 50;
const ITEMS_PER_PAGE = 10;

type FetchFn = (userId: string, page: number, size: number) => Promise<PaginatedListDto<ApiResource>>;

interface ResourceListTabProps {
  userId: string;
  fetchFn: FetchFn;
  emptyLabel: string;
  actionsMode?: ResourceCardActionsMode;
  ownerMode?: boolean;
}

export function ResourceListTab({ userId, fetchFn, emptyLabel, actionsMode = 'default', ownerMode = false }: ResourceListTabProps) {
  const { colors } = useTheme();

  const [allItems, setAllItems] = useState<ApiResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFn(userId, 1, ALL_SIZE);
      setAllItems(data.items ?? []);
    } catch {
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchFn]);

  const loadTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const data = await tagService.getTags({ size: 100 });
      setTags(data?.items ?? []);
    } catch {
      setTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadTags();
  }, [load, loadTags]);

  const filteredItems = useMemo(() => {
    let result = allItems;
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (selectedTagIds.length > 0) {
      result = result.filter((r) =>
        selectedTagIds.every((tagId) => r.tags.some((t) => t.id === tagId)),
      );
    }
    return result;
  }, [allItems, search, selectedTagIds]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const displayedItems = filteredItems.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  const handleTagsChange = (ids: string[]) => {
    setSelectedTagIds(ids);
    setPage(1);
  };

  const hasActiveFilter = search.trim().length > 0 || selectedTagIds.length > 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Ionicons name="search-outline" size={16} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher…"
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <TagFilter
          allTags={tags}
          isLoadingTags={isLoadingTags}
          selectedIds={selectedTagIds}
          onChange={handleTagsChange}
        />
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="file-tray-outline" size={48} color={colors.textLight} />
          <AppText variant="body" muted center style={{ marginTop: Spacing.md }}>
            {hasActiveFilter ? 'Aucune ressource ne correspond à votre recherche.' : emptyLabel}
          </AppText>
        </View>
      ) : (
        <>
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ResourceCard
                resource={item}
                index={index}
                actionsMode={actionsMode}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/resources/[id]',
                    params: {
                      id: item.id,
                      resourceType: item.type?.label ?? '',
                      resourceData: JSON.stringify(item),
                      ...(ownerMode ? { isOwner: 'true' } : {}),
                    },
                  })
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <View style={[styles.pagination, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}>
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={[styles.pageBtn, safePage <= 1 && { opacity: 0.35 }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
              <AppText variant="label" style={{ color: colors.primary }}>Précédent</AppText>
            </Pressable>
            <AppText variant="label" muted>Page {safePage} / {totalPages}</AppText>
            <Pressable
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={[styles.pageBtn, safePage >= totalPages && { opacity: 0.35 }]}
            >
              <AppText variant="label" style={{ color: colors.primary }}>Suivant</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  filterBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});
