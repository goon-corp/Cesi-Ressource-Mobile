import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { commentService } from '@/services/comment.service';
import type { CommentDto } from '@/types/resource.types';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (isToday) {
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate} à ${time}`;
  }

  return formattedDate;
}

interface CommentsSectionProps {
  ressourceId: string;
  userId: string | null;
  isAuthenticated: boolean;
}

export function CommentsSection({ ressourceId, userId, isAuthenticated }: CommentsSectionProps) {
  const { colors } = useTheme();

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const result = await commentService.getByRessource(ressourceId, targetPage, PAGE_SIZE);
      setComments((prev) => append ? [...prev, ...result.items] : result.items);
      setTotal(result.total);
      setPage(targetPage);
    } catch {
      Toast.error('Impossible de charger les commentaires.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [ressourceId]);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const handlePost = async () => {
    if (!userId || !newContent.trim()) return;
    setIsPosting(true);
    try {
      const created = await commentService.create({ content: newContent.trim(), ressourceId, userId });
      setComments((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      setNewContent('');
    } catch {
      Toast.error('Impossible de publier le commentaire.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await commentService.update(editingId, editContent.trim());
      setComments((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      setEditingId(null);
    } catch {
      Toast.error('Impossible de modifier le commentaire.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await commentService.delete(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } catch {
      Toast.error('Impossible de supprimer le commentaire.');
    } finally {
      setDeletingId(null);
    }
  };

  const hasMore = comments.length < total;

  return (
    <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
      <AppText variant="label" style={{ marginBottom: Spacing.md }}>
        Commentaires {total > 0 ? `(${total})` : ''}
      </AppText>

      {isAuthenticated && userId ? (
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <AppTextInput
            label="Nouveau commentaire"
            value={newContent}
            onChangeText={setNewContent}
            placeholder="Ajouter un commentaire..."
            multiline
            numberOfLines={2}
          />
          <AppButton label="Publier" onPress={handlePost} loading={isPosting} disabled={!newContent.trim()} />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.md }} />
      ) : comments.length === 0 ? (
        <View style={[styles.empty, { borderColor: colors.borderLight }]}>
          <Ionicons name="chatbubble-outline" size={28} color={colors.textLight} />
          <AppText variant="body" muted center style={{ marginTop: Spacing.sm }}>
            Aucun commentaire pour l'instant.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {comments.map((comment) => {
            const isOwn = userId === comment.user_id;
            const isEditing = editingId === comment.id;
            const isDeleting = deletingId === comment.id;

            return (
              <View
                key={comment.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              >
                <View style={styles.cardHeader}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(app)/users/[id]', params: { id: comment.user_id } })}
                    style={({ pressed }) => [styles.avatar, { backgroundColor: colors.primaryLight, opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={4}
                  >
                    <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                      {(comment.user_name ?? 'U')[0].toUpperCase()}
                    </AppText>
                  </Pressable>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText variant="label">{comment.user_name ?? 'Utilisateur'}</AppText>
                    <AppText variant="caption" muted>{formatDate(comment.creation_time)}</AppText>
                  </View>
                  {isOwn && !isEditing ? (
                    <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                      <Pressable onPress={() => { setEditingId(comment.id); setEditContent(comment.content); }} hitSlop={8}>
                        <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(comment.id)} hitSlop={8} disabled={isDeleting}>
                        {isDeleting
                          ? <ActivityIndicator size="small" color={colors.error} />
                          : <Ionicons name="trash-outline" size={18} color={colors.error} />
                        }
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                {isEditing ? (
                  <View style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
                    <AppTextInput
                      label="Modifier le commentaire"
                      value={editContent}
                      onChangeText={setEditContent}
                      multiline
                      numberOfLines={2}
                    />
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <AppButton label="Sauvegarder" onPress={handleSaveEdit} loading={isSavingEdit} disabled={!editContent.trim()} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppButton label="Annuler" variant="secondary" onPress={() => setEditingId(null)} disabled={isSavingEdit} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <AppText variant="body" style={{ marginTop: Spacing.sm }}>{comment.content}</AppText>
                )}
              </View>
            );
          })}

          {hasMore ? (
            <AppButton
              label={`Charger plus (${total - comments.length} restants)`}
              variant="secondary"
              onPress={() => load(page + 1, true)}
              loading={isLoadingMore}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  inputRow: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
