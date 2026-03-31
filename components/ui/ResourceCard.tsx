import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import type { ApiResource } from '@/types/resource.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const TYPE_COLORS: Record<string, string> = {
  Article: '#0063CB',
  'Vidéo': '#CE0500',
  Exercice: '#18753C',
  Jeu: '#B34000',
  'Méditation': '#6A6AF4',
  'Activité': '#009081',
  'Événement': '#B34000',
  Event: '#B34000',
};

interface ResourceCardProps {
  resource: ApiResource;
  index: number;
  onPress?: () => void;
}

export function ResourceCard({ resource, index, onPress }: ResourceCardProps) {
  const { colors } = useTheme();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index * 70, 420);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 60 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  const typeLabel = resource.type?.label ?? '';
  const typeColor = TYPE_COLORS[typeLabel] ?? colors.primary;
  const thumbnailUri = resource.thumbnailId
    ? `${API_URL}/ressource-medias/${resource.thumbnailId}`
    : null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
          backgroundColor: colors.surface,
          ...Shadow.sm,
        },
      ]}
    >
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.backgroundAlt }]}>
              <Ionicons name="image-outline" size={36} color={colors.textLight} />
            </View>
          )}
          {typeLabel ? (
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <AppText style={{ color: '#fff', fontSize: FontSize.xs, fontWeight: '700' }}>
                {typeLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <AppText variant="h3" numberOfLines={2} style={{ marginBottom: Spacing.xs }}>
            {resource.title}
          </AppText>
          <AppText variant="bodySmall" muted numberOfLines={2} style={{ marginBottom: Spacing.sm }}>
            {resource.description}
          </AppText>

          {resource.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {resource.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.tag, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                >
                  <AppText variant="caption" muted>{tag.label}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 175,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  content: {
    padding: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
