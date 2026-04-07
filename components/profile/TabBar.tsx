import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';

export type TabKey = 'info' | 'likes' | 'favorites' | 'resources' | 'aside' | 'exploited';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Mes infos' },
  { key: 'likes', label: 'Mes likes' },
  { key: 'favorites', label: 'Mes favoris' },
  { key: 'resources', label: 'Mes ressources' },
  { key: 'aside', label: 'Ma watchlist' },
  { key: 'exploited', label: 'Consultées' },
];

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      bounces={false}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              {
                borderBottomColor: isActive ? colors.primary : 'transparent',
                borderBottomWidth: 2,
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                color: isActive ? colors.primary : colors.textMuted,
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
  },
});
