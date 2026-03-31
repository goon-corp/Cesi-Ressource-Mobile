import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Shadow, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';

interface AppHeaderProps {
  title: string;
  onMenuPress: () => void;
  rightAction?: React.ReactNode;
  showBack?: boolean;
}

export function AppHeader({ title, onMenuPress, rightAction, showBack = false }: AppHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.primary,
          ...Shadow.md,
        },
      ]}
    >
      <View style={styles.inner}>
        <Pressable
          onPress={onMenuPress}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={showBack ? 'Retour' : 'Ouvrir le menu'}
          hitSlop={8}
        >
          <Ionicons
            name={showBack ? 'arrow-back' : 'menu'}
            size={26}
            color={colors.textOnPrimary}
          />
        </Pressable>

        <AppText
          numberOfLines={1}
          style={[styles.title, { color: colors.textOnPrimary }]}
        >
          {title}
        </AppText>

        <View style={styles.rightSlot}>
          {rightAction ?? <View style={{ width: 40 }} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 56,
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
