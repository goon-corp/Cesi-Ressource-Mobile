import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export function HeaderAuthAction() {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const { colors } = useTheme();

  if (isAuthenticated) {
    const displayName = user ? `${user.first_name} ${user.last_name}` : '';
    return (
      <Pressable
        onPress={() => router.push('/(app)/profile')}
        hitSlop={8}
        accessibilityLabel="Mon profil"
        accessibilityRole="button"
      >
        <Avatar
          name={displayName}
          size={34}
          backgroundColor="rgba(255,255,255,0.2)"
          textColor={colors.textOnPrimary}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push('/(auth)/login')}
      style={[styles.loginBtn, { borderColor: 'rgba(255,255,255,0.6)' }]}
      hitSlop={8}
      accessibilityLabel="Se connecter"
      accessibilityRole="button"
    >
      <AppText
        style={{
          color: colors.textOnPrimary,
          fontSize: FontSize.sm,
          fontWeight: '600',
        }}
      >
        Connexion
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loginBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
