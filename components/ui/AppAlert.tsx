import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import type { ColorScheme } from '@/types/theme.types';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AppAlertProps {
  type: AlertType;
  title?: string;
  message: string;
  visible: boolean;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<AlertType, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

function getColors(
  type: AlertType,
  colors: ColorScheme,
): { bg: string; fg: string } {
  const map: Record<AlertType, { bg: string; fg: string }> = {
    success: { bg: colors.successLight, fg: colors.success },
    error: { bg: colors.errorLight, fg: colors.error },
    warning: { bg: colors.warningLight, fg: colors.warning },
    info: { bg: colors.infoLight, fg: colors.info },
  };
  return map[type];
}

export function AppAlert({ type, title, message, visible }: AppAlertProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  const { bg, fg } = getColors(type, colors);

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity }]}>
      <Ionicons name={ICONS[type]} size={20} color={fg} />
      <View style={styles.textContainer}>
        {title && (
          <AppText variant="label" style={{ color: fg }}>
            {title}
          </AppText>
        )}
        <AppText variant="bodySmall" style={{ color: fg }}>
          {message}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
});
