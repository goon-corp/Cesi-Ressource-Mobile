import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderAuthAction } from '@/components/layout/HeaderAuthAction';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontWeight } from '@/constants/Typography';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Quick Access Card ────────────────────────────────────────────────────────

interface QuickCardProps {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  accent?: boolean;
}

function QuickCard({ icon, title, description, onPress, accent = false }: QuickCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.surface,
          borderColor: accent ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
          ...Shadow.md,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.cardIcon,
          { backgroundColor: accent ? 'rgba(255,255,255,0.15)' : colors.primaryLight },
        ]}
      >
        <Ionicons name={icon} size={26} color={accent ? '#FFFFFF' : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          variant="label"
          style={{
            color: accent ? '#FFFFFF' : colors.text,
            fontWeight: FontWeight.semibold,
            marginBottom: 2,
          }}
        >
          {title}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: accent ? 'rgba(255,255,255,0.8)' : colors.textMuted }}
        >
          {description}
        </AppText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={accent ? 'rgba(255,255,255,0.7)' : colors.textLight}
      />
    </Pressable>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText
      variant="label"
      style={[styles.sectionTitle, { color: colors.textMuted }]}
    >
      {children}
    </AppText>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  const greeting = isAuthenticated && user
    ? `Bonjour, ${user.first_name}\u00A0!`
    : 'Bienvenue\u00A0!';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader
        title="Accueil"
        onMenuPress={openDrawer}
        rightAction={<HeaderAuthAction />}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <AppText
            variant="h2"
            style={[styles.heroGreeting, { color: '#FFFFFF' }]}
          >
            {greeting}
          </AppText>
          <AppText
            variant="body"
            style={{ color: 'rgba(255,255,255,0.85)', marginTop: Spacing.xs }}
          >
            La plateforme de ressources pour mieux vivre ensemble.
          </AppText>
        </View>

        {/* Main action */}
        <View style={styles.section}>
          <SectionTitle>EXPLORER</SectionTitle>
          <QuickCard
            icon="book-outline"
            title="Toutes les ressources"
            description="Articles, vidéos, activités et plus encore"
            onPress={() => router.push('/(app)/resources')}
            accent
          />
        </View>

        {/* Personal section */}
        <View style={styles.section}>
          <SectionTitle>MON ESPACE</SectionTitle>
          {isAuthenticated ? (
            <>
              <QuickCard
                icon="person-outline"
                title="Mon profil"
                description="Mes ressources, ma watchlist, mes favoris"
                onPress={() => router.push('/(app)/profile')}
              />
              <QuickCard
                icon="add-circle-outline"
                title="Créer une ressource"
                description="Partagez un contenu avec la communauté"
                onPress={() => router.push('/(app)/resources/create')}
              />
            </>
          ) : (
            <QuickCard
              icon="log-in-outline"
              title="Se connecter"
              description="Accédez à toutes les fonctionnalités"
              onPress={() => router.push('/(auth)/login')}
            />
          )}
        </View>

        {/* Legal / info */}
        <View style={styles.section}>
          <SectionTitle>INFORMATIONS</SectionTitle>
          <QuickCard
            icon="document-text-outline"
            title="Mentions légales"
            description="Informations légales sur l'application"
            onPress={() => router.push('/(app)/mentions-legales')}
          />
          <QuickCard
            icon="shield-checkmark-outline"
            title="Politique de confidentialité"
            description="Comment nous protégeons vos données"
            onPress={() => router.push('/(app)/politique-confidentialite')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xl,
  },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    bottom: 0,
  },
  heroGreeting: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
