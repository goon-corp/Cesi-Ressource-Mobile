import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  withDivider?: boolean;
}

export function InfoRow({ icon, label, value, withDivider }: InfoRowProps) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.row}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <AppText variant="caption" muted>{label}</AppText>
          <AppText variant="body" style={{ color: colors.text }}>{value}</AppText>
        </View>
      </View>
      {withDivider && <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
    </>
  );
}

const styles = StyleSheet.create({
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
