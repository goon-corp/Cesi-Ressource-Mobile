import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderAuthAction } from '@/components/layout/HeaderAuthAction';
import { AppText } from '@/components/ui/AppText';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { MOCK_RESOURCES } from '@/data/resources.mock';
import { RESOURCE_CATEGORIES, type FilterCategory, type Resource } from '@/types/resource.types';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

const ALL_FILTERS: FilterCategory[] = ['Tous', ...RESOURCE_CATEGORIES];

type SortOrder = 'recent' | 'oldest';

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

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Tous');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleSort = () =>
    setSortOrder((prev) => (prev === 'recent' ? 'oldest' : 'recent'));

  const filtered = useMemo<Resource[]>(() => {
    const base = MOCK_RESOURCES.filter((r) => {
      const matchCat = activeFilter === 'Tous' || r.category === activeFilter;
      const matchSearch =
        !search.trim() ||
        r.title.toLowerCase().includes(search.trim().toLowerCase());
      return matchCat && matchSearch;
    });

    return [...base].sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'recent' ? -diff : diff;
    });
  }, [search, activeFilter, sortOrder]);

  const renderItem = useCallback(
    ({ item, index }: { item: Resource; index: number }) => (
      <ResourceCard resource={item} index={index} />
    ),
    [],
  );

  const searchBorderColor = searchFocused ? colors.inputBorderFocus : colors.border;

  const {isAuthenticated, logout} = useAuth();
  const {user} = useUser();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader
        title="Ressources Relationnelles"
        onMenuPress={openDrawer}
        rightAction={<HeaderAuthAction />}
      />

      {/* ── Search + Filters (hors FlatList pour garantir les mises à jour) ── */}
      <View style={[styles.controls, { backgroundColor: colors.background }]}>
        {/* Search bar */}
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

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          keyboardShouldPersistTaps="handled"
        >
          {ALL_FILTERS.map((f) => (
            <CategoryChip
              key={f}
              label={f}
              isActive={activeFilter === f}
              onPress={() => setActiveFilter(f)}
            />
          ))}
        </ScrollView>

        {/* Toolbar: result count + date sort */}
        <View style={[styles.toolbar, { borderBottomColor: colors.borderLight }]}>
          <AppText variant="caption" muted>
            {filtered.length} ressource{filtered.length !== 1 ? 's' : ''}
          </AppText>

          <Pressable
            onPress={toggleSort}
            style={[styles.sortBtn, { borderColor: colors.border }]}
            accessibilityLabel={`Trier par date : ${sortOrder === 'recent' ? 'plus récent d\'abord' : 'plus ancien d\'abord'}`}
          >
            <Ionicons
              name={sortOrder === 'recent' ? 'arrow-down' : 'arrow-up'}
              size={13}
              color={colors.primary}
            />
            <AppText
              variant="caption"
              style={{ color: colors.primary, fontWeight: '600', marginLeft: 3 }}
            >
              {sortOrder === 'recent' ? 'Plus récent' : 'Plus ancien'}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* ── Resource list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
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
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
});
