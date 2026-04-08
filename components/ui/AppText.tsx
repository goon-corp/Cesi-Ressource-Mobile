import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, FontSize, FontWeight } from '@/constants/Typography';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'link';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  muted?: boolean;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  muted = false,
  center = false,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();
  const textColor = color ?? (muted ? colors.textMuted : colors.text);

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: textColor },
        center && styles.center,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.regular,
  },
  h1: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * 1.2,
  },
  h2: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['2xl'] * 1.25,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * 1.3,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * 1.5,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * 1.5,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * 1.5,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * 1.4,
  },
  link: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    textDecorationLine: 'underline',
  },
  center: {
    textAlign: 'center',
  },
});
