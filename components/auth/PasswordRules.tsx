import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';

export const PASSWORD_RULES = [
  { label: 'Entre 5 et 20 caractères', test: (p: string) => p.length >= 5 && p.length <= 20 },
  { label: 'Au moins une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Au moins un chiffre', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Au moins un symbole', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function isPasswordValid(p: string): boolean {
  return PASSWORD_RULES.every(({ test }) => test(p));
}

export function PasswordRules({ password }: { password: string }) {
  const { colors } = useTheme();
  if (!password) return null;

  return (
    <View style={styles.container}>
      {PASSWORD_RULES.map(({ label, test }) => {
        const ok = test(password);
        return (
          <View key={label} style={styles.row}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={ok ? colors.success : colors.textMuted}
            />
            <AppText
              variant="caption"
              style={{ marginLeft: 6, color: ok ? colors.success : colors.textMuted }}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export function ConfirmPasswordMatch({ password, confirm }: { password: string; confirm: string }) {
  const { colors } = useTheme();
  if (!confirm) return null;

  const match = password === confirm;
  return (
    <View style={[styles.row, { marginTop: -Spacing.xs, marginBottom: Spacing.md }]}>
      <Ionicons
        name={match ? 'checkmark-circle' : 'close-circle'}
        size={14}
        color={match ? colors.success : colors.error}
      />
      <AppText
        variant="caption"
        style={{ marginLeft: 6, color: match ? colors.success : colors.error }}
      >
        {match ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
