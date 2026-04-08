import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

interface StatCardProps {
  value: number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, ...Shadow.sm }]}>
      <AppText style={{ color: colors.primary, fontSize: FontSize.xl, fontWeight: '700' }}>
        {value}
      </AppText>
      <AppText variant="caption" muted center style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
