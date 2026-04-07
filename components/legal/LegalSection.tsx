import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="label" style={{ color: colors.primary, marginBottom: Spacing.xs }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function BulletItem({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bullet}>
      <AppText variant="body" style={{ color: colors.primary, marginRight: Spacing.xs }}>•</AppText>
      <AppText variant="body" style={{ flex: 1, color: colors.text, lineHeight: 22 }}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
});
