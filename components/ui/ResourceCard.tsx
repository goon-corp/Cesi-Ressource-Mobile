import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Shadow, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import type { Resource } from '@/types/resource.types';

const CATEGORY_COLORS: Record<string, string> = {
  Article: '#0063CB',
  Vidéo: '#CE0500',
  Exercice: '#18753C',
  Jeu: '#B34000',
  Méditation: '#6A6AF4',
  Activité: '#009081',
};

interface ResourceCardProps {
  resource: Resource;
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
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 60 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  const categoryColor = CATEGORY_COLORS[resource.category] ?? colors.primary;

  const formattedDate = new Date(resource.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

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
        {/* Image */}
        <View>
          <Image source={{ uri: resource.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <AppText style={{ color: '#fff', fontSize: FontSize.xs, fontWeight: '700' }}>
              {resource.category}
            </AppText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <AppText variant="h3" numberOfLines={2} style={{ marginBottom: Spacing.xs }}>
            {resource.title}
          </AppText>
          <AppText
            variant="bodySmall"
            muted
            numberOfLines={2}
            style={{ marginBottom: Spacing.md }}
          >
            {resource.description}
          </AppText>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <View style={styles.metaRow}>
              <Ionicons name="person-circle-outline" size={15} color={colors.textMuted} />
              <AppText variant="caption" muted style={{ marginLeft: 4 }}>
                {resource.author}
              </AppText>
              <AppText variant="caption" muted style={{ marginLeft: Spacing.sm }}>
                · {formattedDate}
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="heart-outline" size={15} color={colors.error} />
              <AppText variant="caption" muted style={{ marginLeft: 4 }}>
                {resource.likesCount}
              </AppText>
            </View>
          </View>
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
  categoryBadge: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
