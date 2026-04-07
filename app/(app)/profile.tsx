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
import { Toast } from 'toastify-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/hooks/useTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ResourceCard, type ResourceCardActionsMode } from '@/components/ui/ResourceCard';
import { TagFilter } from '@/components/ui/TagFilter';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { userService } from '@/services/user.service';
import { tagService } from '@/services/tag.service';
import type { ApiResource, TagDto, PaginatedListDto } from '@/types/resource.types';

// ─── Tab definition ───────────────────────────────────────────────────────────

type TabKey = 'info' | 'likes' | 'favorites' | 'resources' | 'aside' | 'exploited';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Mes infos' },
  { key: 'likes', label: 'Mes likes' },
  { key: 'favorites', label: 'Mes favoris' },
  { key: 'resources', label: 'Mes ressources' },
  { key: 'aside', label: 'Ma watchlist' },
  { key: 'exploited', label: 'Consultées' },
];

// ─── Tab bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

function TabBar({ active, onChange }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tabStyles.container}
      bounces={false}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              tabStyles.tab,
              {
                borderBottomColor: isActive ? colors.primary : 'transparent',
                borderBottomWidth: 2,
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                color: isActive ? colors.primary : colors.textMuted,
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
  },
});

// ─── Info row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  withDivider?: boolean;
}

function InfoRow({ icon, label, value, withDivider }: InfoRowProps) {
  const { colors } = useTheme();
  return (
    <>
      <View style={infoStyles.row}>
        <View style={[infoStyles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View style={infoStyles.content}>
          <AppText variant="caption" muted>{label}</AppText>
          <AppText variant="body" style={{ color: colors.text }}>{value}</AppText>
        </View>
      </View>
      {withDivider && <View style={[infoStyles.divider, { backgroundColor: colors.borderLight }]} />}
    </>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 2 },
  divider: {
    height: 1,
    marginLeft: 36 + Spacing.md,
  },
});

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.surface, ...Shadow.sm }]}>
      <AppText style={{ color: colors.primary, fontSize: FontSize.xl, fontWeight: '700' }}>
        {value}
      </AppText>
      <AppText variant="caption" muted center style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

// ─── Resource list tab ────────────────────────────────────────────────────────

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

function ResourceListTab({ userId, fetchFn, emptyLabel, actionsMode = 'default', ownerMode = false }: ResourceListTabProps) {
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
      <View style={listTabStyles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[listTabStyles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[listTabStyles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Ionicons name="search-outline" size={16} color={colors.placeholder} />
          <TextInput
            style={[listTabStyles.searchInput, { color: colors.text }]}
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
        <View style={listTabStyles.centered}>
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
            contentContainerStyle={listTabStyles.list}
            showsVerticalScrollIndicator={false}
          />
          <View style={[listTabStyles.pagination, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}>
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={[listTabStyles.pageBtn, safePage <= 1 && { opacity: 0.35 }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
              <AppText variant="label" style={{ color: colors.primary }}>Précédent</AppText>
            </Pressable>
            <AppText variant="label" muted>Page {safePage} / {totalPages}</AppText>
            <Pressable
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={[listTabStyles.pageBtn, safePage >= totalPages && { opacity: 0.35 }]}
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

const listTabStyles = StyleSheet.create({
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { isLoading, logout } = useAuth();
  const { user, refetchUser } = useUser();
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();

  const [activeTab, setActiveTab] = useState<TabKey>('info');

  useFocusEffect(useCallback(() => {
    refetchUser();
  }, [refetchUser]));

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
      return;
    }
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [isLoading, user, headerAnim, contentAnim]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    Toast.success('Vous avez été déconnecté.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Mon profil" onMenuPress={openDrawer} />

      {/* Hero */}
      <Animated.View
        style={[styles.hero, { backgroundColor: colors.primary, opacity: headerAnim }]}
      >
        <View style={[styles.avatarRing, { borderColor: colors.background }]}>
          <Avatar
            name={`${user.first_name} ${user.last_name}`}
            size={68}
            backgroundColor="rgba(255,255,255,0.2)"
            textColor="#FFFFFF"
          />
        </View>
        <AppText
          style={{ color: colors.textOnPrimary, fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.sm }}
        >
          {user.first_name} {user.last_name}
        </AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          @{user.user_name}
        </AppText>
      </Animated.View>

      <Animated.View
        style={[
          styles.statsRow,
          {
            opacity: contentAnim,
            transform: [{
              translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            }],
          },
        ]}
      >
        <StatCard value={user.authored_ressources_count} label="Ressources" />
        <StatCard value={user.liked_ressources_count} label="Likes" />
        <StatCard value={user.favorite_ressources_count} label="Favoris" />
      </Animated.View>

      {/* Tab bar */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TabBar active={activeTab} onChange={setActiveTab} />
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'info' && (
          <ScrollView
            contentContainerStyle={styles.infoContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.push('/(app)/edit-profile')}
              style={({ pressed }) => [
                styles.editRow,
                { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <AppText variant="body" style={{ flex: 1, color: colors.text, marginLeft: Spacing.md }}>
                Modifier mon profil
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>

            <AppText variant="label" muted style={styles.sectionTitle}>INFORMATIONS</AppText>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <InfoRow icon="mail-outline" label="Adresse email" value={user.email} withDivider />
              <InfoRow icon="at-outline" label="Nom d'utilisateur" value={`@${user.user_name}`} withDivider />
              <InfoRow icon="person-outline" label="Prénom" value={user.first_name} withDivider />
              <InfoRow icon="person-outline" label="Nom" value={user.last_name} />
            </View>

            <View style={{ marginTop: Spacing.lg }}>
              <AppButton label="Se déconnecter" onPress={handleLogout} variant="danger" />
            </View>
          </ScrollView>
        )}

        {activeTab === 'likes' && (
          <ResourceListTab
            userId={user.id}
            fetchFn={userService.getLikedResources}
            emptyLabel="Vous n'avez encore liké aucune ressource."
            actionsMode="liked"
          />
        )}

        {activeTab === 'favorites' && (
          <ResourceListTab
            userId={user.id}
            fetchFn={userService.getFavResources}
            emptyLabel="Vous n'avez encore mis aucune ressource en favori."
            actionsMode="favorited"
          />
        )}

        {activeTab === 'resources' && (
          <ResourceListTab
            userId={user.id}
            fetchFn={userService.getAuthoredResources}
            emptyLabel="Vous n'avez encore publié aucune ressource."
            actionsMode="default"
            ownerMode
          />
        )}

        {activeTab === 'aside' && (
          <ResourceListTab
            userId={user.id}
            fetchFn={userService.getAsideResources}
            emptyLabel="Vous n'avez aucune ressource dans votre watchlist."
          />
        )}

        {activeTab === 'exploited' && (
          <ResourceListTab
            userId={user.id}
            fetchFn={userService.getExploitedResources}
            emptyLabel="Vous n'avez encore consulté aucune ressource."
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
  },
  infoContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
});
