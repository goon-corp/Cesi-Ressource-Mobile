import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/hooks/useTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

// ─── Info Row ─────────────────────────────────────────────────────────────────
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
          <AppText variant="caption" muted>
            {label}
          </AppText>
          <AppText variant="body" style={{ color: colors.text }}>
            {value}
          </AppText>
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
  content: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    marginLeft: 36 + Spacing.md,
  },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  value: string | number;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.surface, ...Shadow.sm }]}>
      <AppText
        style={{ color: colors.primary, fontSize: FontSize.xl, fontWeight: '700' }}
      >
        {value}
      </AppText>
      <AppText variant="caption" muted center style={{ marginTop: 2 }}>
        {label}
      </AppText>
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { isLoading, logout } = useAuth();
  const { user } = useUser();
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();

  // Entrance animation
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

  const memberSince = new Date(Date.now()).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Mon profil" onMenuPress={openDrawer} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <Animated.View
          style={[
            styles.hero,
            { backgroundColor: colors.primary, opacity: headerAnim },
          ]}
        >
          <View style={[styles.avatarRing, { borderColor: colors.background }]}>
            <Avatar
              name={`${user.first_name} ${user.last_name}`}
              size={88}
              backgroundColor="rgba(255,255,255,0.2)"
              textColor="#FFFFFF"
            />
          </View>

          <AppText
            style={{
              color: colors.textOnPrimary,
              fontSize: FontSize.xl,
              fontWeight: '700',
              marginTop: Spacing.md,
            }}
          >
            {user.first_name} {user.last_name}
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            @{user.user_name}
          </AppText>
        </Animated.View>

        <Animated.View
          style={[
            styles.body,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value={0} label="Ressources" />
            <StatCard value={0} label="Favoris" />
            <StatCard value={0} label="Commentaires" />
          </View>

          {/* Edit button */}
          <Pressable
            style={({ pressed }) => [
              styles.editRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <AppText
              variant="body"
              style={{ flex: 1, color: colors.text, marginLeft: Spacing.md }}
            >
              Modifier mon profil
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </Pressable>

          {/* Info section */}
          <AppText variant="label" muted style={styles.sectionTitle}>
            INFORMATIONS
          </AppText>
          <View
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <InfoRow icon="mail-outline" label="Adresse email" value={user.email} withDivider />
            <InfoRow
              icon="at-outline"
              label="Nom d'utilisateur"
              value={`@${user.user_name}`}
              withDivider
            />
            <InfoRow
              icon="calendar-outline"
              label="Membre depuis"
              value={memberSince}
            />
          </View>

          {/* Logout */}
          <View style={{ marginTop: Spacing.lg }}>
            <AppButton label="Se déconnecter" onPress={handleLogout} variant="danger" />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 3,
  },
  body: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    marginTop: -Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
