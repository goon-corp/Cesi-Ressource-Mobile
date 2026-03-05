import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  ...props
}: AppButtonProps) {
  const { colors } = useTheme();
  const isDisabled = !!(disabled || loading);

  const bgColor = {
    primary: colors.primary,
    secondary: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  }[variant];

  const borderColor = {
    primary: 'transparent',
    secondary: colors.primary,
    ghost: 'transparent',
    danger: 'transparent',
  }[variant];

  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnPrimary
      : variant === 'secondary'
        ? colors.primary
        : colors.text;

  const fontSize = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md }[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: isDisabled ? 0.4 : pressed ? 0.8 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <AppText
            style={[
              styles.label,
              {
                color: labelColor,
                fontSize,
                fontWeight: FontWeight.semibold,
                marginLeft: leftIcon ? Spacing.sm : 0,
              },
            ]}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    includeFontPadding: false,
  },
});
