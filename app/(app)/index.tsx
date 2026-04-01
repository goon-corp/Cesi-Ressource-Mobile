import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderAuthAction } from '@/components/layout/HeaderAuthAction';
import { AppText } from '@/components/ui/AppText';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { resourceService } from '@/services/resource.service';
import { tagService } from '@/services/tag.service';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiResource } from '@/types/resource.types';

const PAGE_SIZE = 10;

// ─── Category Chip ────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function CategoryChip({ label, isActive, onPress }: ChipProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
        onPress={handlePress}
      >
        <AppText
          variant="label"
          style={{ color: isActive ? colors.textOnPrimary : colors.textMuted }}
        >
          {label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={52} color={colors.textLight} />
      <AppText variant="h3" muted center style={{ marginTop: Spacing.md }}>
        Aucun résultat
      </AppText>
      <AppText variant="body" muted center style={{ marginTop: Spacing.xs }}>
        Modifiez votre recherche ou changez de catégorie.
      </AppText>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const [resources, setResources] = useState<ApiResource[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const hasFocused = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const { data: resourceTypes } = useQuery(
    ['resource-types'],
    () => resourceService.getResourceTypes(),
  );

  const { data: tagsData } = useQuery(
    ['tags-list'],
    () => tagService.getTags({ size: 100 }),
  );

  const allTags = useMemo(() => (Array.isArray(tagsData) ? tagsData : []), [tagsData]);

  const fetchResources = useCallback(async (pageNum: number, reset: boolean) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const result = await resourceService.getResources({
        page: pageNum,
        size: PAGE_SIZE,
        ...(debouncedSearch ? { RessourceTitle: debouncedSearch } : {}),
        ...(activeFilter ? { RessourceType: activeFilter } : {}),
        ...(selectedTagIds.length > 0 ? { RessourceTags: selectedTagIds } : {}),
      });
      const items = Array.isArray(result) ? result : [];
      if (reset) {
        setResources(items);
      } else {
        setResources((prev) => [...prev, ...items]);
      }
      setHasNextPage(items.length >= PAGE_SIZE);
      setPage(pageNum);
    } catch {
      // silently handled
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearch, activeFilter, selectedTagIds]);

  // Handles filter/search/tag changes after initial mount
  useEffect(() => {
    if (!hasFocused.current) return;
    fetchResources(1, true);
  }, [fetchResources]);

  // Handles initial load + returning from create/detail
  useFocusEffect(
    useCallback(() => {
      hasFocused.current = true;
      fetchResources(1, true);
    }, [fetchResources]),
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage || isLoadingMore || isLoading) return;
    fetchResources(page + 1, false);
  }, [hasNextPage, isLoadingMore, isLoading, page, fetchResources]);

  const renderItem = useCallback(
    ({ item, index }: { item: ApiResource; index: number }) => (
      <ResourceCard
        resource={item}
        index={index}
        onPress={() =>
          router.push({
            pathname: '/(app)/resources/[id]',
            params: { id: item.id, resourceType: item.type?.label ?? '' },
          })
        }
      />
    ),
    [],
  );

  const filters = useMemo<string[]>(
    () => (resourceTypes ?? []).map((t) => t.label),
    [resourceTypes],
  );

  const toggleTag = useCallback((id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }, []);

  const searchBorderColor = searchFocused ? colors.inputBorderFocus : colors.border;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader
        title="Ressources Relationnelles"
        onMenuPress={openDrawer}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            {isAuthenticated && (
              <Pressable
                onPress={() => router.push('/(app)/resources/create')}
                style={styles.addBtn}
                accessibilityLabel="Créer une ressource"
                hitSlop={8}
              >
                <Ionicons name="add" size={24} color={colors.textOnPrimary} />
              </Pressable>
            )}
            <HeaderAuthAction />
          </View>
        }
      />

      <View style={[styles.controls, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: searchBorderColor },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une ressource..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          keyboardShouldPersistTaps="handled"
        >
          <CategoryChip
            label="Tous"
            isActive={activeFilter === null}
            onPress={() => setActiveFilter(null)}
          />
          {filters.map((f) => (
            <CategoryChip
              key={f}
              label={f}
              isActive={activeFilter === f}
              onPress={() => setActiveFilter(activeFilter === f ? null : f)}
            />
          ))}
        </ScrollView>

        {allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            keyboardShouldPersistTaps="handled"
          >
            {allTags.map((tag) => (
              <CategoryChip
                key={tag.id}
                label={tag.label}
                isActive={selectedTagIds.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
          </ScrollView>
        )}

        <View style={[styles.toolbar, { borderBottomColor: colors.borderLight }]}>
          <AppText variant="caption" muted>
            {isLoading
              ? 'Chargement...'
              : `${resources.length} ressource${resources.length !== 1 ? 's' : ''}`}
          </AppText>
          {selectedTagIds.length > 0 && (
            <Pressable onPress={() => setSelectedTagIds([])} hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.primary }}>
                Effacer les tags
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : hasNextPage ? (
              <Pressable
                style={[styles.loadMoreBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={loadMore}
              >
                <AppText variant="label" style={{ color: colors.primary }}>Charger plus</AppText>
                <Ionicons name="chevron-down" size={16} color={colors.primary} style={{ marginLeft: Spacing.xs }} />
              </Pressable>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.xs,
  },
  filtersRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    padding: Spacing.xs,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
