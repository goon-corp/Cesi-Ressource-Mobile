import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  withDivider?: boolean;
  disabled?: boolean;
}

export function SettingRow({ icon, label, onPress, withDivider, disabled = false }: SettingRowProps) {
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.row,
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
          style={{ flex: 1, marginLeft: Spacing.md, color: disabled ? colors.textLight : colors.text }}
        >
          {label}
        </AppText>
        {disabled
          ? <Ionicons name="lock-closed-outline" size={15} color={colors.textLight} />
          : <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        }
      </Pressable>
      {withDivider && <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20,
  },
});
