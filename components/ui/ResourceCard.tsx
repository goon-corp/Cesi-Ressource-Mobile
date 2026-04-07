import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Toast } from 'toastify-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { resourceService } from '@/services/resource.service';
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

// 'default'   → boutons J'aime + Favoris (états initialement false)
// 'liked'     → uniquement "Retirer des likes" (pré-liké)
// 'favorited' → uniquement "Retirer des favoris" (pré-favori)
export type ResourceCardActionsMode = 'default' | 'liked' | 'favorited';

interface ResourceCardProps {
  resource: ApiResource;
  index: number;
  onPress?: () => void;
  actionsMode?: ResourceCardActionsMode;
}

export function ResourceCard({ resource, index, onPress, actionsMode = 'default' }: ResourceCardProps) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [liked, setLiked] = useState(actionsMode === 'liked');
  const [favorited, setFavorited] = useState(actionsMode === 'favorited');
  const [likePending, setLikePending] = useState(false);
  const [favPending, setFavPending] = useState(false);

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

  const handleLike = async () => {
    console.log("liking")
    if (likePending) return;
    const next = !liked;
    setLiked(next);
    setLikePending(true);
    try {
      await resourceService.likeResource(resource.id);
    } catch {
      setLiked(!next);
      Toast.error('Impossible de mettre à jour le like.');
    } finally {
      setLikePending(false);
    }
  };

  const handleFavorite = async () => {
    if (favPending) return;
    const next = !favorited;
    setFavorited(next);
    setFavPending(true);
    try {
      await resourceService.favoriteResource(resource.id);
    } catch {
      setFavorited(!next);
      Toast.error('Impossible de mettre à jour le favori.');
    } finally {
      setFavPending(false);
    }
  };

  const typeLabel = resource.type?.label ?? '';
  const typeColor = TYPE_COLORS[typeLabel] ?? colors.primary;
  const thumbnailUri = resource.thumbnail_id
    ? `${API_URL}/ressource-medias/${resource.thumbnail_id}`
    : null;

  const renderActions = () => {
    if (!isAuthenticated) return null;

    if (actionsMode === 'liked') {
      return (
        <View style={[styles.actionBar, { borderTopColor: colors.borderLight }]}>
          <Pressable style={styles.actionBtn} onPress={handleLike} disabled={likePending}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? colors.error : colors.textMuted}
            />
            <AppText variant="caption" style={{ marginLeft: 5, color: liked ? colors.error : colors.textMuted }}>
              {liked ? 'Retirer des likes' : 'Retiré des likes'}
            </AppText>
          </Pressable>
        </View>
      );
    }

    if (actionsMode === 'favorited') {
      return (
        <View style={[styles.actionBar, { borderTopColor: colors.borderLight }]}>
          <Pressable style={styles.actionBtn} onPress={handleFavorite} disabled={favPending}>
            <Ionicons
              name={favorited ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={favorited ? '#B34000' : colors.textMuted}
            />
            <AppText variant="caption" style={{ marginLeft: 5, color: favorited ? '#B34000' : colors.textMuted }}>
              {favorited ? 'Retirer des favoris' : 'Retiré des favoris'}
            </AppText>
          </Pressable>
        </View>
      );
    }

    return null;
  };

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
        <View style={styles.imageWrapper}>
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

      {renderActions()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imageWrapper: {
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
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: 2,
  },
  actionDivider: {
    width: 1,
    marginVertical: Spacing.xs,
  },
});
