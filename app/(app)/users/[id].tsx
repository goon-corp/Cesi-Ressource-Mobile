import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { ResourceListTab } from '@/components/profile/ResourceListTab';
import { StatCard } from '@/components/profile/StatCard';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';
import { userService } from '@/services/user.service';
import { friendService } from '@/services/friend.service';
import type { UserProfileDto } from '@/types/user.types';

type TabKey = 'resources' | 'likes' | 'favorites';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'resources', label: 'Ressources' },
  { key: 'likes', label: 'Likes' },
  { key: 'favorites', label: 'Favoris' },
];

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export default function PublicProfileScreen() {
  const { id: profileUserId } = useLocalSearchParams<{ id: string }>();
  const { userId, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('resources');
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendLoading, setFriendLoading] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!profileUserId) return;
    if (profileUserId === userId) {
      router.replace('/(app)/profile');
      return;
    }
    setIsLoading(true);
    userService.getUserProfile(profileUserId)
      .then((data) => {
        setProfile(data);
        Animated.sequence([
          Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(contentAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      })
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [profileUserId, userId, headerAnim, contentAnim]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !profileUserId || profileUserId === userId) return;

    friendService.getRequests({ UserSenderId: userId, UserReceiverId: profileUserId, size: 1 })
      .then((res) => {
        if (res.items.length > 0) {
          const status = res.items[0].request_status;
          setFriendStatus(status === 'Accepted' ? 'accepted' : 'pending_sent');
          return null;
        }
        return friendService.getRequests({ UserSenderId: profileUserId, UserReceiverId: userId, size: 1 });
      })
      .then((res) => {
        if (!res) return;
        if (res.items.length > 0) {
          const status = res.items[0].request_status;
          setFriendStatus(status === 'Accepted' ? 'accepted' : 'pending_received');
        }
      })
      .catch(() => {});
  }, [isAuthenticated, userId, profileUserId]);

  const handleSendRequest = async () => {
    if (!profileUserId) return;
    setFriendLoading(true);
    try {
      await friendService.send(profileUserId);
      setFriendStatus('pending_sent');
      Toast.success("Demande d'ami envoyée.");
    } catch {
      Toast.error("Impossible d'envoyer la demande.");
    } finally {
      setFriendLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profileUserId || !userId) return;
    setFriendLoading(true);
    try {
      await friendService.updateStatus(profileUserId, userId, 'Accepted');
      setFriendStatus('accepted');
      Toast.success('Demande acceptée !');
    } catch {
      Toast.error("Impossible d'accepter la demande.");
    } finally {
      setFriendLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profileUserId || !userId) return;
    setFriendLoading(true);
    try {
      try { await friendService.remove(userId, profileUserId); }
      catch { await friendService.remove(profileUserId, userId); }
      setFriendStatus('none');
      Toast.success('Ami retiré.');
    } catch {
      Toast.error("Impossible de retirer l'ami.");
    } finally {
      setFriendLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!isAuthenticated) return null;

    switch (friendStatus) {
      case 'accepted':
        return (
          <Pressable
            onPress={handleRemoveFriend}
            disabled={friendLoading}
            style={({ pressed }) => [styles.friendBtn, { borderColor: colors.success, backgroundColor: `${colors.success}18`, opacity: pressed || friendLoading ? 0.6 : 1 }]}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <AppText variant="label" style={{ color: colors.success, marginLeft: Spacing.xs }}>Amis</AppText>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <View style={[styles.friendBtn, { borderColor: colors.border, backgroundColor: colors.backgroundAlt ?? colors.surface }]}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <AppText variant="label" muted style={{ marginLeft: Spacing.xs }}>Demande envoyée</AppText>
          </View>
        );
      case 'pending_received':
        return (
          <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
            <Pressable
              onPress={handleAcceptRequest}
              disabled={friendLoading}
              style={({ pressed }) => [styles.friendBtn, { borderColor: colors.primary, backgroundColor: colors.primary, opacity: pressed || friendLoading ? 0.6 : 1 }]}
            >
              <Ionicons name="person-add" size={16} color={colors.textOnPrimary} />
              <AppText variant="label" style={{ color: colors.textOnPrimary, marginLeft: Spacing.xs }}>Accepter</AppText>
            </Pressable>
            <Pressable
              onPress={handleRemoveFriend}
              disabled={friendLoading}
              style={({ pressed }) => [styles.friendBtnIcon, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed || friendLoading ? 0.6 : 1 }]}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      default:
        return (
          <Pressable
            onPress={handleSendRequest}
            disabled={friendLoading}
            style={({ pressed }) => [styles.friendBtn, { borderColor: colors.primary, backgroundColor: colors.primary, opacity: pressed || friendLoading ? 0.6 : 1 }]}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.textOnPrimary} />
            <AppText variant="label" style={{ color: colors.textOnPrimary, marginLeft: Spacing.xs }}>Ajouter en ami</AppText>
          </Pressable>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <AppHeader title="Profil" onMenuPress={() => router.back()} showBack />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <AppHeader title="Profil" onMenuPress={() => router.back()} showBack />
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={48} color={colors.textLight} />
          <AppText variant="body" muted center style={{ marginTop: Spacing.md }}>
            Utilisateur introuvable.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title={`@${profile.user_name}`} onMenuPress={() => router.back()} showBack />

      <Animated.View style={[styles.hero, { backgroundColor: colors.primary, opacity: headerAnim }]}>
        <View style={[styles.avatarRing, { borderColor: colors.background }]}>
          <Avatar
            name={`${profile.first_name} ${profile.last_name}`}
            size={68}
            backgroundColor="rgba(255,255,255,0.2)"
            textColor="#FFFFFF"
          />
        </View>
        <AppText style={{ color: colors.textOnPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.sm }}>
          {profile.first_name} {profile.last_name}
        </AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          @{profile.user_name}
        </AppText>
        <View style={{ marginTop: Spacing.md }}>
          {renderFriendButton()}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.statsRow,
          {
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        <StatCard value={profile.authored_ressources_count} label="Ressources" />
        <StatCard value={profile.liked_ressources_count} label="Likes" />
        <StatCard value={profile.favorite_ressources_count} label="Favoris" />
      </Animated.View>

      <View style={[styles.tabBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, { borderBottomColor: isActive ? colors.primary : 'transparent' }]}
            >
              <AppText
                variant="label"
                style={{ color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? FontWeight.bold : FontWeight.medium }}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'resources' && profileUserId && (
          <ResourceListTab
            userId={profileUserId}
            fetchFn={userService.getAuthoredResources}
            emptyLabel="Aucune ressource publiée."
          />
        )}
        {activeTab === 'likes' && profileUserId && (
          <ResourceListTab
            userId={profileUserId}
            fetchFn={userService.getLikedResources}
            emptyLabel="Aucun like."
          />
        )}
        {activeTab === 'favorites' && profileUserId && (
          <ResourceListTab
            userId={profileUserId}
            fetchFn={userService.getFavResources}
            emptyLabel="Aucun favori."
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2,
  },
  friendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  friendBtnIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
