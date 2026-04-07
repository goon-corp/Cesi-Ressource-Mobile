import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { AppButton } from "@/components/ui/AppButton";
import { AppDatePicker } from "@/components/ui/AppDatePicker";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useQuery } from "@/hooks/useQuery";
import { eventService } from "@/services/event.service";
import { articleService } from "@/services/article.service";
import { quizService } from "@/services/quiz.service";
import { pollService } from "@/services/poll.service";
import { progressionService } from "@/services/progression.service";
import { commentService } from "@/services/comment.service";
import { reportService } from "@/services/report.service";
import { ApiError } from "@/services/api";
import type {
  ApiEvent,
  ApiArticle,
  ApiResource,
  ApiQuiz,
  ApiPoll,
  ApiQuizzQuestion,
  ApiPollOption,
  CommentDto,
  ReportTypeDto,
} from "@/types/resource.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isEventLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes("event") || n.includes("venement");
}

function isArticleLabel(label: string): boolean {
  return normalizeLabel(label).includes("article");
}

function isQuizLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes("quiz");
}

function isPollLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes("sondage") || n.includes("poll");
}

// ─── Type-specific detail components ─────────────────────────────────────────

function EventDetail({ event }: { event: ApiEvent }) {
  const { colors } = useTheme();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View>
      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons
          name={event.is_virtual ? "globe-outline" : "location-outline"}
          size={18}
          color={colors.primary}
        />
        <AppText variant="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
          {event.is_virtual ? "Événement en ligne" : event.location}
        </AppText>
      </View>

      {event.is_virtual && event.event_link ? (
        <View
          style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}
        >
          <Ionicons name="link-outline" size={18} color={colors.primary} />
          <AppText
            variant="body"
            style={{ flex: 1, marginLeft: Spacing.sm }}
            numberOfLines={1}
          >
            {event.event_link}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="caption" muted>
            Début
          </AppText>
          <AppText variant="body">{formatDate(event.date_start)}</AppText>
        </View>
      </View>

      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.info} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="caption" muted>
            Fin
          </AppText>
          <AppText variant="body">{formatDate(event.date_end)}</AppText>
        </View>
      </View>
    </View>
  );
}

function ArticleDetail({ article }: { article: ApiArticle }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.articleContent,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <AppText variant="body" style={{ lineHeight: 24 }}>
        {article.content}
      </AppText>
    </View>
  );
}

// ─── Quiz detail ──────────────────────────────────────────────────────────────

interface QuizDetailProps {
  questions: ApiQuizzQuestion[];
  userId: string;
}

function QuizDetail({ questions, userId }: QuizDetailProps) {
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        parsedAnswers: (() => {
          try {
            return JSON.parse(q.possible_answers) as string[];
          } catch {
            return [] as string[];
          }
        })(),
      })),
    [questions],
  );

  const allAnswered =
    parsed.length > 0 && parsed.every((q) => answers[q.id] !== undefined);
  const score = submitted
    ? parsed.filter((q) => answers[q.id] === q.correct_answer).length
    : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await Promise.all(
        questions.map((q) => quizService.participateInQuestion(q.id, userId)),
      );
      setSubmitted(true);
    } catch {
      Toast.error("Erreur lors de la participation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (parsed.length === 0) {
    return (
      <View
        style={[
          interactiveStyles.empty,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Ionicons
          name="help-circle-outline"
          size={32}
          color={colors.textLight}
        />
        <AppText variant="body" muted center style={{ marginTop: Spacing.sm }}>
          Aucune question disponible.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      {parsed.map((q, i) => (
        <View
          key={q.id}
          style={[
            interactiveStyles.questionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="label" style={{ marginBottom: Spacing.md }}>
            {i + 1}. {q.question}
          </AppText>
          <View style={{ gap: Spacing.sm }}>
            {q.parsedAnswers.map((answer) => {
              const isSelected = answers[q.id] === answer;
              const isCorrect = submitted && answer === q.correct_answer;
              const isWrong =
                submitted && isSelected && answer !== q.correct_answer;
              return (
                <Pressable
                  key={answer}
                  onPress={() =>
                    !submitted &&
                    setAnswers((prev) => ({ ...prev, [q.id]: answer }))
                  }
                  disabled={submitted}
                  style={[
                    interactiveStyles.answerOption,
                    {
                      borderColor: isCorrect
                        ? colors.success
                        : isWrong
                          ? colors.error
                          : isSelected
                            ? colors.primary
                            : colors.border,
                      backgroundColor: isCorrect
                        ? colors.successLight
                        : isWrong
                          ? (colors.errorLight ?? "#FFF0F0")
                          : isSelected
                            ? colors.primaryLight
                            : colors.inputBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      interactiveStyles.radioOuter,
                      {
                        borderColor: isCorrect
                          ? colors.success
                          : isWrong
                            ? colors.error
                            : isSelected
                              ? colors.primary
                              : colors.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          interactiveStyles.radioInner,
                          {
                            backgroundColor: isCorrect
                              ? colors.success
                              : isWrong
                                ? colors.error
                                : colors.primary,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <AppText
                    variant="body"
                    style={{ flex: 1, marginLeft: Spacing.sm }}
                  >
                    {answer}
                  </AppText>
                  {submitted && isCorrect && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.success}
                    />
                  )}
                  {submitted && isWrong && (
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.error}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {submitted ? (
        <View
          style={[
            interactiveStyles.resultBanner,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="trophy-outline" size={28} color={colors.primary} />
          <AppText
            variant="h3"
            style={{ color: colors.primary, marginTop: Spacing.sm }}
          >
            {score} / {parsed.length}
          </AppText>
          <AppText variant="caption" muted center>
            bonnes réponses
          </AppText>
        </View>
      ) : (
        <AppButton
          label="Soumettre mes réponses"
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!allAnswered || submitting}
          fullWidth
        />
      )}
    </View>
  );
}

// ─── Poll detail ──────────────────────────────────────────────────────────────

interface PollDetailProps {
  options: ApiPollOption[];
  poll: ApiPoll;
}

function PollDetail({ options, poll }: PollDetailProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (!selectedId) return;
    setVoting(true);
    try {
      await pollService.voteForOption(selectedId);
      setVoted(true);
    } catch {
      Toast.error("Erreur lors du vote.");
    } finally {
      setVoting(false);
    }
  };

  if (options.length === 0) {
    return (
      <View
        style={[
          interactiveStyles.empty,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Ionicons name="bar-chart-outline" size={32} color={colors.textLight} />
        <AppText variant="body" muted center style={{ marginTop: Spacing.sm }}>
          Aucune option disponible.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => !voted && setSelectedId(option.id)}
              disabled={voted}
              style={[
                interactiveStyles.answerOption,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? colors.primaryLight
                    : colors.inputBackground,
                },
              ]}
            >
              <View
                style={[
                  interactiveStyles.radioOuter,
                  { borderColor: isSelected ? colors.primary : colors.border },
                ]}
              >
                {isSelected && (
                  <View
                    style={[
                      interactiveStyles.radioInner,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
              <AppText
                variant="body"
                style={{ flex: 1, marginLeft: Spacing.sm }}
              >
                {option.option}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {voted ? (
        <View
          style={[
            interactiveStyles.resultBanner,
            {
              backgroundColor: colors.successLight,
              borderColor: colors.success,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <AppText
            variant="body"
            style={{ color: colors.success, marginLeft: Spacing.sm }}
          >
            Vote enregistré — {poll.vote_count + 1} vote(s) au total
          </AppText>
        </View>
      ) : (
        <AppButton
          label="Voter"
          variant="primary"
          onPress={handleVote}
          loading={voting}
          disabled={!selectedId || voting}
          fullWidth
        />
      )}
    </View>
  );
}

const interactiveStyles = StyleSheet.create({
  questionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    padding: Spacing.sm + 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirmer",
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={[modalStyles.box, { backgroundColor: colors.surface }]}>
          <AppText variant="h3" style={{ marginBottom: Spacing.sm }}>
            {title}
          </AppText>
          <AppText variant="body" muted style={{ marginBottom: Spacing.lg }}>
            {message}
          </AppText>
          <View style={{ gap: Spacing.sm }}>
            <AppButton
              label={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              loading={loading}
            />
            <AppButton
              label="Annuler"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  box: {
    width: "100%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
});

// ─── Watchlist toggle row ─────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconActive: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel: string;
  active: boolean;
  activeColor: string;
  pending: boolean;
  onPress: () => void;
}

function ToggleRow({
  icon,
  iconActive,
  label,
  sublabel,
  active,
  activeColor,
  pending,
  onPress,
}: ToggleRowProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.94,
        useNativeDriver: true,
        speed: 80,
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      style={styles.toggleRow}
    >
      <Animated.View
        style={[
          styles.toggleIcon,
          {
            backgroundColor: active ? activeColor + "22" : colors.backgroundAlt,
            transform: [{ scale }],
          },
        ]}
      >
        {pending ? (
          <ActivityIndicator
            size="small"
            color={active ? activeColor : colors.textMuted}
          />
        ) : (
          <Ionicons
            name={active ? iconActive : icon}
            size={22}
            color={active ? activeColor : colors.textMuted}
          />
        )}
      </Animated.View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <AppText
          variant="label"
          style={{ color: active ? activeColor : colors.text }}
        >
          {label}
        </AppText>
        <AppText variant="caption" muted>
          {sublabel}
        </AppText>
      </View>
      <Ionicons
        name={active ? "checkmark-circle" : "ellipse-outline"}
        size={22}
        color={active ? activeColor : colors.border}
      />
    </Pressable>
  );
}

// ─── Watchlist section ────────────────────────────────────────────────────────

interface WatchlistSectionProps {
  ressourceId: string;
  userId: string;
}

function WatchlistSection({ ressourceId, userId }: WatchlistSectionProps) {
  const { colors } = useTheme();

  const [localState, setLocalState] = useState<{
    isAside: boolean;
    isExploited: boolean;
    exists: boolean;
  } | null>(null);
  const [asidePending, setAsidePending] = useState(false);
  const [exploitedPending, setExploitedPending] = useState(false);

  const {
    data: progression,
    error: progressionError,
    isLoading,
  } = useQuery(["progression", ressourceId, userId], () =>
    progressionService.getProgression(ressourceId, userId),
  );

  useEffect(() => {
    if (progression) {
      setLocalState({
        isAside: progression.is_aside,
        isExploited: progression.is_exploited,
        exists: true,
      });
    } else if (progressionError) {
      setLocalState({ isAside: false, isExploited: false, exists: false });
    }
  }, [progression, progressionError]);

  const toggle = async (
    field: "isAside" | "isExploited",
    setPending: (v: boolean) => void,
  ) => {
    if (!localState) return;
    const next = !localState[field];
    const optimistic = { ...localState, [field]: next };
    setLocalState(optimistic);
    setPending(true);
    try {
      if (!localState.exists) {
        await progressionService.createProgression(
          ressourceId,
          userId,
          optimistic.isAside,
          optimistic.isExploited,
        );
        setLocalState((s) => (s ? { ...s, exists: true } : s));
      } else {
        await progressionService.updateProgression(
          ressourceId,
          userId,
          optimistic.isAside,
          optimistic.isExploited,
        );
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
        <AppText variant="label" style={{ marginBottom: Spacing.md }}>
          Ma progression
        </AppText>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
      <AppText variant="label" style={{ marginBottom: Spacing.md }}>
        Ma progression
      </AppText>
      <View
        style={[
          styles.watchlistCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ToggleRow
          icon="bookmark-outline"
          iconActive="bookmark"
          label="Mettre de côté"
          sublabel="Ajouter à ma liste de lecture"
          active={localState.isAside}
          activeColor={colors.primary}
          pending={asidePending}
          onPress={() => toggle("isAside", setAsidePending)}
        />
        <View
          style={[
            styles.watchlistSeparator,
            { backgroundColor: colors.borderLight },
          ]}
        />
        <ToggleRow
          icon="eye-outline"
          iconActive="eye"
          label="Marquer comme consulté"
          sublabel="J'ai lu / regardé cette ressource"
          active={localState.isExploited}
          activeColor={colors.success}
          pending={exploitedPending}
          onPress={() => toggle("isExploited", setExploitedPending)}
        />
      </View>
    </View>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────

interface CommentsSectionProps {
  ressourceId: string;
  userId: string | null;
  isAuthenticated: boolean;
}

function CommentsSection({
  ressourceId,
  userId,
  isAuthenticated,
}: CommentsSectionProps) {
  const { colors } = useTheme();

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [newContent, setNewContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const result = await commentService.getByRessource(
          ressourceId,
          targetPage,
          PAGE_SIZE,
        );
        setComments((prev) =>
          append ? [...prev, ...result.items] : result.items,
        );
        setTotal(result.total);
        setPage(targetPage);
      } catch {
        Toast.error("Impossible de charger les commentaires.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [ressourceId],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const handlePost = async () => {
    if (!userId || !newContent.trim()) return;
    setIsPosting(true);
    try {
      const created = await commentService.create({
        content: newContent.trim(),
        ressourceId,
        userId,
      });
      setComments((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      setNewContent("");
    } catch {
      Toast.error("Impossible de publier le commentaire.");
    } finally {
      setIsPosting(false);
    }
  };

  const startEdit = (comment: CommentDto) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await commentService.update(
        editingId,
        editContent.trim(),
      );
      setComments((prev) =>
        prev.map((c) => (c.id === editingId ? updated : c)),
      );
      setEditingId(null);
    } catch {
      Toast.error("Impossible de modifier le commentaire.");
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
      Toast.error("Impossible de supprimer le commentaire.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const formattedDate = date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (isToday) {
      const time = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${formattedDate} à ${time}`;
    }

    return formattedDate;
  };

  const hasMore = comments.length < total;

  return (
    <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
      <AppText variant="label" style={{ marginBottom: Spacing.md }}>
        Commentaires {total > 0 ? `(${total})` : ""}
      </AppText>

      {isAuthenticated && userId ? (
        <View
          style={[
            commentStyles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <AppTextInput
            label="Nouveau commentaire"
            value={newContent}
            onChangeText={setNewContent}
            placeholder="Ajouter un commentaire..."
            multiline
            numberOfLines={2}
          />
          <AppButton
            label="Publier"
            onPress={handlePost}
            loading={isPosting}
            disabled={!newContent.trim()}
          />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: Spacing.md }}
        />
      ) : comments.length === 0 ? (
        <View
          style={[commentStyles.empty, { borderColor: colors.borderLight }]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={28}
            color={colors.textLight}
          />
          <AppText
            variant="body"
            muted
            center
            style={{ marginTop: Spacing.sm }}
          >
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
                style={[
                  commentStyles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={commentStyles.cardHeader}>
                  <View
                    style={[
                      commentStyles.avatar,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: colors.primary, fontWeight: "700" }}
                    >
                      {(comment.user_name ?? "U")[0].toUpperCase()}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText variant="label">
                      {comment.user_name ?? "Utilisateur"}
                    </AppText>
                    <AppText variant="caption" muted>
                      {formatDate(comment.creation_time)}
                    </AppText>
                  </View>
                  {isOwn && !isEditing ? (
                    <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                      <Pressable onPress={() => startEdit(comment)} hitSlop={8}>
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(comment.id)}
                        hitSlop={8}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.error}
                          />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.error}
                          />
                        )}
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
                    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <AppButton
                          label="Sauvegarder"
                          onPress={handleSaveEdit}
                          loading={isSavingEdit}
                          disabled={!editContent.trim()}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppButton
                          label="Annuler"
                          variant="secondary"
                          onPress={() => setEditingId(null)}
                          disabled={isSavingEdit}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <AppText variant="body" style={{ marginTop: Spacing.sm }}>
                    {comment.content}
                  </AppText>
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

// ─── Report modal ─────────────────────────────────────────────────────────────

interface ReportModalProps {
  visible: boolean;
  reportTypes: ReportTypeDto[];
  loadingTypes: boolean;
  submitting: boolean;
  onSelect: (reportTypeId: string) => void;
  onClose: () => void;
}

function ReportModal({
  visible,
  reportTypes,
  loadingTypes,
  submitting,
  onSelect,
  onClose,
}: ReportModalProps) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[modalStyles.box, { backgroundColor: colors.surface }]}>
          <AppText variant="h3" style={{ marginBottom: Spacing.sm }}>
            Signaler la ressource
          </AppText>
          <AppText variant="body" muted style={{ marginBottom: Spacing.md }}>
            Choisissez un motif de signalement.
          </AppText>
          {loadingTypes ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {reportTypes.map((type) => (
                <AppButton
                  key={type.id}
                  label={type.label}
                  variant="secondary"
                  onPress={() => onSelect(type.id)}
                  loading={submitting}
                  disabled={submitting}
                />
              ))}
            </View>
          )}
          <View style={{ marginTop: Spacing.md }}>
            <AppButton
              label="Annuler"
              variant="danger"
              onPress={onClose}
              disabled={submitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResourceDetailScreen() {
  const {
    id,
    resourceType,
    resourceData,
    isOwner: isOwnerParam,
  } = useLocalSearchParams<{
    id: string;
    resourceType: string;
    resourceData?: string;
    isOwner?: string;
  }>();
  const { colors } = useTheme();
  const { isAuthenticated, userId } = useAuth();

  const isOwner = isOwnerParam === "true";
  const isEvent = isEventLabel(resourceType ?? "");
  const isArticle = isArticleLabel(resourceType ?? "");
  const isQuiz = isQuizLabel(resourceType ?? "");
  const isPoll = isPollLabel(resourceType ?? "");

  const {
    data: eventData,
    isLoading: loadingEvent,
    error: errorEvent,
    refetch: refetchEvent,
  } = useQuery(
    ["resource-detail-event", id],
    () => eventService.getEventByResourceId(id!),
    { enabled: !!id && isEvent },
  );

  const {
    data: articleData,
    isLoading: loadingArticle,
    error: errorArticle,
    refetch: refetchArticle,
  } = useQuery(
    ["resource-detail-article", id],
    () => articleService.getArticleByResourceId(id!),
    { enabled: !!id && isArticle },
  );

  const {
    data: quizData,
    isLoading: loadingQuiz,
    error: errorQuiz,
  } = useQuery(
    ["resource-detail-quiz", id],
    () => quizService.getQuizByResourceId(id!),
    { enabled: !!id && isQuiz },
  );

  const {
    data: pollData,
    isLoading: loadingPoll,
    error: errorPoll,
  } = useQuery(
    ["resource-detail-poll", id],
    () => pollService.getPollByResourceId(id!),
    { enabled: !!id && isPoll },
  );

  // ─── Edit state ────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsVirtual, setEditIsVirtual] = useState(false);
  const [editDateStart, setEditDateStart] = useState("");
  const [editDateEnd, setEditDateEnd] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editEventLink, setEditEventLink] = useState("");

  // ─── Delete state ──────────────────────────────────────────────────────────
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Report state ──────────────────────────────────────────────────────────
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTypes, setReportTypes] = useState<ReportTypeDto[]>([]);
  const [reportLoadingTypes, setReportLoadingTypes] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const openReportModal = async () => {
    setReportModalVisible(true);
    setReportLoadingTypes(true);
    try {
      const types = await reportService.getReportTypes();
      setReportTypes(types);
    } catch {
      Toast.error("Impossible de charger les motifs de signalement");
      setReportModalVisible(false);
    } finally {
      setReportLoadingTypes(false);
    }
  };

  const handleReport = async (reportTypeId: string) => {
    if (!id) return;
    setReportSubmitting(true);
    try {
      await reportService.createReport(id, reportTypeId);
      Toast.success("Signalement envoyé");
      setReportModalVisible(false);
    } catch {
      Toast.error("Impossible de signaler la ressource");
    } finally {
      setReportSubmitting(false);
    }
  };

  const enterEditMode = () => {
    if (!resource) return;
    setEditTitle(resource.title);
    setEditDescription(resource.description);
    if (isArticle && articleData) {
      setEditContent(articleData.content);
    }
    if (isEvent && eventData) {
      setEditIsVirtual(eventData.is_virtual);
      setEditDateStart(eventData.date_start);
      setEditDateEnd(eventData.date_end);
      setEditLocation(eventData.location);
      setEditEventLink(eventData.event_link ?? "");
    }
    setEditMode(true);
  };

  const handleEditSubmit = async () => {
    if (!resource) return;
    setEditLoading(true);
    try {
      const ressourceBase = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        tags: resource.tags.map((t) => t.id),
        statusId: resource.status?.id ?? "",
        confidentialityTypeId: resource.confidentiality_type?.id ?? "",
        typeId: resource.type?.id ?? "",
      };

      if (isEvent && eventData) {
        await eventService.updateEvent(eventData.id, {
          id: eventData.id,
          isVirtual: editIsVirtual,
          dateStart: editDateStart,
          dateEnd: editDateEnd,
          eventLink: editEventLink,
          location: editLocation,
          ressourceId: resource.id,
          ressource: ressourceBase,
        });
        await refetchEvent();
      } else if (isArticle && articleData) {
        await articleService.updateArticle(articleData.id, {
          content: editContent.trim(),
          ressource: ressourceBase,
        });
        await refetchArticle();
      }

      Toast.success("Ressource mise à jour.");
      setEditMode(false);
    } catch {
      Toast.error("Impossible de mettre à jour la ressource.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      if (isEvent && eventData) {
        await eventService.deleteEvent(eventData.id);
      } else if (isArticle && articleData) {
        await articleService.deleteArticle(articleData.id);
      } else if (isQuiz && quizData) {
        await quizService.deleteQuiz(quizData.id);
      } else if (isPoll && pollData) {
        await pollService.deletePoll(pollData.id);
      }
      Toast.success("Ressource supprimée.");
      router.back();
    } catch {
      Toast.error("Impossible de supprimer la ressource.");
      setConfirmDeleteVisible(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fallbackResource: ApiResource | null = useMemo(() => {
    if (!resourceData) return null;
    try {
      return JSON.parse(resourceData) as ApiResource;
    } catch {
      return null;
    }
  }, [resourceData]);

  const isLoading =
    loadingEvent || loadingArticle || loadingQuiz || loadingPoll;
  const hasError =
    (isEvent && errorEvent) ||
    (isArticle && errorArticle) ||
    (isQuiz && errorQuiz) ||
    (isPoll && errorPoll);
  const hasFetcher = isEvent || isArticle || isQuiz || isPoll;

  const resource: ApiResource | null =
    eventData?.ressource ??
    articleData?.ressource ??
    quizData?.ressource ??
    pollData?.ressource ??
    fallbackResource ??
    null;

  const renderSpecificContent = () => {
    if (isEvent && eventData) return <EventDetail event={eventData} />;
    if (isArticle && articleData)
      return <ArticleDetail article={articleData} />;
    if (isQuiz && quizData) {
      if (isAuthenticated && userId) {
        return (
          <QuizDetail questions={quizData.questions ?? []} userId={userId} />
        );
      }
      return (
        <AppText variant="body" muted center>
          Connectez-vous pour participer au quiz.
        </AppText>
      );
    }
    if (isPoll && pollData) {
      return <PollDetail options={pollData.options ?? []} poll={pollData} />;
    }
    return null;
  };

  const renderContent = () => {
    if (hasFetcher && isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (hasFetcher && hasError && !resource) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <AppText
            variant="body"
            muted
            center
            style={{ marginTop: Spacing.md }}
          >
            Impossible de charger la ressource.
          </AppText>
        </View>
      );
    }

    if (!resource) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="document-outline"
            size={48}
            color={colors.textLight}
          />
          <AppText
            variant="body"
            muted
            center
            style={{ marginTop: Spacing.md }}
          >
            Ressource introuvable.
          </AppText>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {resourceType ? (
          <View
            style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}
          >
            <AppText
              variant="caption"
              style={{ color: colors.primary, fontWeight: "700" }}
            >
              {resourceType}
            </AppText>
          </View>
        ) : null}

        <AppText variant="h2" style={{ marginBottom: Spacing.sm }}>
          {resource.title}
        </AppText>

        <View style={styles.metaBadges}>
          {resource.confidentiality_type ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.backgroundAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="shield-outline"
                size={13}
                color={colors.textMuted}
              />
              <AppText variant="caption" muted style={{ marginLeft: 4 }}>
                {resource.confidentiality_type.label}
              </AppText>
            </View>
          ) : null}
          {resource.status ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.successLight,
                  borderColor: colors.success,
                },
              ]}
            >
              <AppText variant="caption" style={{ color: colors.success }}>
                {resource.status.label}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
          <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
            Description
          </AppText>
          <AppText variant="body">{resource.description}</AppText>
        </View>

        {isEvent || isArticle || isQuiz || isPoll ? (
          <View
            style={[styles.section, { borderTopColor: colors.borderLight }]}
          >
            <AppText variant="label" style={{ marginBottom: Spacing.md }}>
              {isArticle
                ? "Contenu"
                : isQuiz
                  ? "Questions"
                  : isPoll
                    ? "Options"
                    : "Informations spécifiques"}
            </AppText>
            {renderSpecificContent()}
          </View>
        ) : null}

        {resource.tags && resource.tags.length > 0 ? (
          <View
            style={[styles.section, { borderTopColor: colors.borderLight }]}
          >
            <AppText variant="label" style={{ marginBottom: Spacing.sm }}>
              Tags
            </AppText>
            <View style={styles.tagsRow}>
              {resource.tags.map((tag) => (
                <View
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    {tag.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {isAuthenticated && !isOwner && id ? (
          <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
            <AppButton
              label="Signaler cette ressource"
              variant="secondary"
              onPress={openReportModal}
              leftIcon={
                <Ionicons name="flag-outline" size={18} color={colors.error} />
              }
            />
          </View>
        ) : null}

        {isAuthenticated && userId && id ? (
          <WatchlistSection ressourceId={id} userId={userId} />
        ) : null}

        {id ? (
          <CommentsSection
            ressourceId={id}
            userId={userId ?? null}
            isAuthenticated={isAuthenticated}
          />
        ) : null}

        {isOwner && (
          <View
            style={[styles.section, { borderTopColor: colors.borderLight }]}
          >
            <AppText variant="label" style={{ marginBottom: Spacing.md }}>
              Gérer ma ressource
            </AppText>
            <View style={{ gap: Spacing.sm }}>
              {isEvent || isArticle ? (
                <AppButton
                  label="Modifier"
                  variant="secondary"
                  onPress={enterEditMode}
                  leftIcon={
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={colors.primary}
                    />
                  }
                />
              ) : null}
              <AppButton
                label="Supprimer"
                variant="danger"
                onPress={() => setConfirmDeleteVisible(true)}
                leftIcon={
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                }
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  if (editMode) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <Pressable
            onPress={() => setEditMode(false)}
            style={styles.backBtn}
            hitSlop={8}
            disabled={editLoading}
          >
            <AppText variant="body" style={{ color: colors.textMuted }}>
              Annuler
            </AppText>
          </Pressable>
          <AppText
            variant="h3"
            numberOfLines={1}
            style={{ flex: 1, marginLeft: Spacing.sm, marginRight: Spacing.sm }}
          >
            Modifier
          </AppText>
          <Pressable
            onPress={handleEditSubmit}
            style={styles.backBtn}
            hitSlop={8}
            disabled={editLoading}
          >
            {editLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppText
                variant="body"
                style={{ color: colors.primary, fontWeight: "700" }}
              >
                Sauvegarder
              </AppText>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppTextInput
            label="Titre"
            value={editTitle}
            onChangeText={setEditTitle}
            required
          />
          <AppTextInput
            label="Description"
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            numberOfLines={3}
            required
          />

          {isArticle ? (
            <AppTextInput
              label="Contenu"
              value={editContent}
              onChangeText={setEditContent}
              multiline
              numberOfLines={8}
              required
            />
          ) : null}

          {isEvent ? (
            <>
              <View style={editStyles.switchRow}>
                <AppText variant="label">Événement en ligne</AppText>
                <Switch
                  value={editIsVirtual}
                  onValueChange={setEditIsVirtual}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {editIsVirtual ? (
                <AppTextInput
                  label="Lien de l'événement"
                  value={editEventLink}
                  onChangeText={setEditEventLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              ) : (
                <AppTextInput
                  label="Lieu"
                  value={editLocation}
                  onChangeText={setEditLocation}
                />
              )}

              <AppDatePicker
                label="Date de début"
                value={editDateStart}
                onChange={setEditDateStart}
                required
              />
              <AppDatePicker
                label="Date de fin"
                value={editDateEnd}
                onChange={setEditDateEnd}
                required
              />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText
          variant="h3"
          numberOfLines={1}
          style={{ flex: 1, marginLeft: Spacing.sm }}
        >
          {resource?.title ?? "Détails"}
        </AppText>
      </View>

      {renderContent()}

      <ConfirmModal
        visible={confirmDeleteVisible}
        title="Supprimer la ressource"
        message="Cette action est irréversible. La ressource sera définitivement supprimée."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
        loading={deleteLoading}
      />

      <ReportModal
        visible={reportModalVisible}
        reportTypes={reportTypes}
        loadingTypes={reportLoadingTypes}
        submitting={reportSubmitting}
        onSelect={handleReport}
        onClose={() => setReportModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const editStyles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
});

const commentStyles = StyleSheet.create({
  inputRow: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing["2xl"],
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  metaBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  articleContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  watchlistCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  watchlistSeparator: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
