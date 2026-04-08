import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { progressionService } from '@/services/progression.service';
import { useQuery } from '@/hooks/useQuery';

// ─── Toggle Row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel: string;
  active: boolean;
  activeColor: string;
  pending: boolean;
  onPress: () => void;
}

function ToggleRow({ icon, iconActive, label, sublabel, active, activeColor, pending, onPress }: ToggleRowProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 80 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={pending} style={styles.toggleRow}>
      <Animated.View
        style={[
          styles.toggleIcon,
          {
            backgroundColor: active ? activeColor + '22' : colors.backgroundAlt,
            transform: [{ scale }],
          },
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={active ? activeColor : colors.textMuted} />
        ) : (
          <Ionicons name={active ? iconActive : icon} size={22} color={active ? activeColor : colors.textMuted} />
        )}
      </Animated.View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <AppText variant="label" style={{ color: active ? activeColor : colors.text }}>{label}</AppText>
        <AppText variant="caption" muted>{sublabel}</AppText>
      </View>
      <Ionicons
        name={active ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={active ? activeColor : colors.border}
      />
    </Pressable>
  );
}

// ─── Watchlist Section ────────────────────────────────────────────────────────

interface WatchlistSectionProps {
  ressourceId: string;
  userId: string;
}

export function WatchlistSection({ ressourceId, userId }: WatchlistSectionProps) {
  const { colors } = useTheme();

  const [localState, setLocalState] = useState<{
    isAside: boolean;
    isExploited: boolean;
    exists: boolean;
  } | null>(null);
  const [asidePending, setAsidePending] = useState(false);
  const [exploitedPending, setExploitedPending] = useState(false);

  const { data: progression, error: progressionError, isLoading } = useQuery(
    ['progression', ressourceId, userId],
    () => progressionService.getProgression(ressourceId, userId),
  );

  useEffect(() => {
    if (progression) {
      setLocalState({ isAside: progression.is_aside, isExploited: progression.is_exploited, exists: true });
    } else if (progressionError) {
      setLocalState({ isAside: false, isExploited: false, exists: false });
    }
  }, [progression, progressionError]);

  const toggle = async (field: 'isAside' | 'isExploited', setPending: (v: boolean) => void) => {
    if (!localState) return;
    const next = !localState[field];
    const optimistic = { ...localState, [field]: next };
    setLocalState(optimistic);
    setPending(true);
    try {
      if (!localState.exists) {
        await progressionService.createProgression(ressourceId, userId, optimistic.isAside, optimistic.isExploited);
        setLocalState((s) => (s ? { ...s, exists: true } : s));
      } else {
        await progressionService.updateProgression(ressourceId, userId, optimistic.isAside, optimistic.isExploited);
      }
    } catch {
      setLocalState((s) => (s ? { ...s, [field]: !next } : s));
    } finally {
      setPending(false);
    }
  };

  if (isLoading || localState === null) {
    return (
      <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
        <AppText variant="label" style={{ marginBottom: Spacing.md }}>Ma progression</AppText>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
      <AppText variant="label" style={{ marginBottom: Spacing.md }}>Ma progression</AppText>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ToggleRow
          icon="bookmark-outline"
          iconActive="bookmark"
          label="Mettre de côté"
          sublabel="Ajouter à ma liste de lecture"
          active={localState.isAside}
          activeColor={colors.primary}
          pending={asidePending}
          onPress={() => toggle('isAside', setAsidePending)}
        />
        <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
        <ToggleRow
          icon="eye-outline"
          iconActive="eye"
          label="Marquer comme consulté"
          sublabel="J'ai lu / regardé cette ressource"
          active={localState.isExploited}
          activeColor={colors.success}
          pending={exploitedPending}
          onPress={() => toggle('isExploited', setExploitedPending)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
