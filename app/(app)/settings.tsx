import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useDrawer } from '@/contexts/DrawerContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderAuthAction } from '@/components/layout/HeaderAuthAction';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import type { ThemeMode } from '@/types/theme.types';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', label: 'Clair', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { mode: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

// ─── Setting Row ──────────────────────────────────────────────────────────────
interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  withDivider?: boolean;
  disabled?: boolean;
}

function SettingRow({ icon, label, onPress, withDivider, disabled = false }: SettingRowProps) {
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.settingRow,
          { opacity: disabled ? 0.38 : pressed ? 0.7 : 1 },
          !disabled && pressed && { backgroundColor: colors.backgroundAlt },
        ]}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityState={{ disabled }}
      >
        <Ionicons name={icon} size={20} color={disabled ? colors.textLight : colors.textMuted} />
        <AppText
          variant="body"
          style={{
            flex: 1,
            marginLeft: Spacing.md,
            color: disabled ? colors.textLight : colors.text,
          }}
        >
          {label}
        </AppText>
        {disabled ? (
          <Ionicons name="lock-closed-outline" size={15} color={colors.textLight} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        )}
      </Pressable>
      {withDivider && <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader
        title="Paramètres"
        onMenuPress={openDrawer}
        rightAction={<HeaderAuthAction />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <AppText variant="label" muted style={styles.sectionTitle}>
          APPARENCE
        </AppText>
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        >
          <AppText variant="label" style={{ color: colors.text, marginBottom: Spacing.md }}>
            Thème de l'application
          </AppText>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(({ mode, label, icon }) => {
              const isActive = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive ? colors.primaryLight : colors.backgroundAlt,
                      borderColor: isActive ? colors.primary : colors.border,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                >
                  <Ionicons
                    name={icon}
                    size={22}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                  <AppText
                    variant="caption"
                    style={{
                      color: isActive ? colors.primary : colors.textMuted,
                      marginTop: Spacing.xs,
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Account */}
        <AppText variant="label" muted style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          COMPTE
        </AppText>

        {!isAuthenticated && (
          <Pressable
            style={[styles.authBanner, { backgroundColor: colors.infoLight, borderColor: colors.info }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <AppText variant="bodySmall" style={{ flex: 1, color: colors.info, marginLeft: Spacing.sm }}>
              Connectez-vous pour accéder aux paramètres de compte.
            </AppText>
            <AppText variant="label" style={{ color: colors.info }}>
              Connexion →
            </AppText>
          </Pressable>
        )}

        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        >
          <SettingRow
            icon="person-outline"
            label="Modifier mon profil"
            onPress={() => router.push('/(app)/edit-profile')}
            disabled={!isAuthenticated}
            withDivider
          />
          <SettingRow
            icon="lock-closed-outline"
            label="Changer mon mot de passe"
            disabled={!isAuthenticated}
            withDivider
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            disabled={!isAuthenticated}
          />
        </View>

        {/* About */}
        <AppText variant="label" muted style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          À PROPOS
        </AppText>
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        >
          <SettingRow
            icon="information-circle-outline"
            label="Mentions légales"
            onPress={() => router.push('/(app)/mentions-legales')}
            withDivider
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Politique de confidentialité"
            onPress={() => router.push('/(app)/politique-confidentialite')}
            withDivider
          />
          <SettingRow
            icon="document-text-outline"
            label="Conditions d'utilisation"
            onPress={() => router.push('/(app)/conditions-utilisation')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20,
  },
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
});
