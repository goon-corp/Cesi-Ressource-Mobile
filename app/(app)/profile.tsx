import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { TabBar } from '@/components/profile/TabBar';
import { InfoRow } from '@/components/profile/InfoRow';
import { StatCard } from '@/components/profile/StatCard';
import { ResourceListTab } from '@/components/profile/ResourceListTab';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { userService } from '@/services/user.service';
import type { TabKey } from '@/components/profile/TabBar';

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

      <View style={[styles.tabBarWrapper, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TabBar active={activeTab} onChange={setActiveTab} />
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'info' && (
          <ScrollView contentContainerStyle={styles.infoContent} showsVerticalScrollIndicator={false}>
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
