import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppDatePicker } from '@/components/ui/AppDatePicker';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { useQuery } from '@/hooks/useQuery';
import { useMutation } from '@/hooks/useMutation';
import { resourceService } from '@/services/resource.service';
import { tagService } from '@/services/tag.service';
import { eventService, type CreateEventPayload } from '@/services/event.service';
import { articleService, type CreateArticlePayload } from '@/services/article.service';
import { quizService, type CreateQuizPayload } from '@/services/quiz.service';
import { pollService, type CreatePollPayload } from '@/services/poll.service';
import type { TagDto } from '@/types/resource.types';

// ─── Quiz builder types ───────────────────────────────────────────────────────

interface QuizAnswer {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
  correctAnswerId: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makeDefaultQuestion(): QuizQuestion {
  const a1 = { id: generateId(), text: '' };
  const a2 = { id: generateId(), text: '' };
  return { id: generateId(), question: '', answers: [a1, a2], correctAnswerId: a1.id };
}

// ─── Poll builder types ───────────────────────────────────────────────────────

interface PollOption {
  id: string;
  text: string;
}

function makeDefaultOptions(): PollOption[] {
  return [{ id: generateId(), text: '' }, { id: generateId(), text: '' }];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLabel(label: string): string {
  return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isEventLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes('event') || n.includes('venement');
}

function isArticleLabel(label: string): boolean {
  return normalizeLabel(label).includes('article');
}

function isQuizLabel(label: string): boolean {
  return normalizeLabel(label).includes('quiz');
}

function isPollLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes('poll') || n.includes('sondage');
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS = ['Infos', 'Catégories', 'Détails'];

function Stepper({ current }: { current: number }) {
  const { colors } = useTheme();

  return (
    <View style={stepperStyles.container}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <View style={stepperStyles.stepWrapper}>
            <View
              style={[
                stepperStyles.circle,
                {
                  backgroundColor: i <= current ? colors.primary : colors.surface,
                  borderColor: i <= current ? colors.primary : colors.border,
                },
              ]}
            >
              {i < current ? (
                <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
              ) : (
                <AppText
                  style={{
                    color: i === current ? colors.textOnPrimary : colors.textMuted,
                    fontSize: FontSize.xs,
                    fontWeight: '700',
                  }}
                >
                  {i + 1}
                </AppText>
              )}
            </View>
            <AppText variant="caption" muted style={{ marginTop: 4, textAlign: 'center' }}>
              {label}
            </AppText>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={[
                stepperStyles.line,
                { backgroundColor: i < current ? colors.primary : colors.border },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 13,
  },
});

// ─── AppSelect ────────────────────────────────────────────────────────────────

interface SelectOption {
  id: string;
  label: string;
}

interface AppSelectProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  required?: boolean;
  error?: string;
}

function AppSelect({ label, placeholder, options, value, onChange, required, error }: AppSelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
        {label}
        {required ? <AppText style={{ color: colors.error }}> *</AppText> : null}
      </AppText>

      <Pressable
        style={[
          selectStyles.trigger,
          {
            borderColor: error ? colors.error : colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <AppText
          variant="body"
          style={{ flex: 1, color: selected ? colors.text : colors.placeholder }}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 4 }}>{error}</AppText>
        </View>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={selectStyles.overlay} onPress={() => setOpen(false)}>
          <View style={[selectStyles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[selectStyles.sheetHeader, { borderBottomColor: colors.borderLight }]}>
              <AppText variant="h3">{label}</AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => o.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    selectStyles.option,
                    item.id === value && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => { onChange(item.id); setOpen(false); }}
                >
                  <AppText
                    variant="body"
                    style={{ color: item.id === value ? colors.primary : colors.text }}
                  >
                    {item.label}
                  </AppText>
                  {item.id === value ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const selectStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});

// ─── TagSelector ──────────────────────────────────────────────────────────────

interface TagSelectorProps {
  allTags: TagDto[];
  isLoadingTags: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTagCreated: (tag: TagDto) => void;
}

function TagSelector({ allTags, isLoadingTags, selectedIds, onChange, onTagCreated }: TagSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(
    () => allTags.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())),
    [allTags, search],
  );

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setIsCreating(true);
    try {
      const newTag = await tagService.createTag(trimmed);
      onTagCreated(newTag);
      onChange([...selectedIds, newTag.id]);
      setSearch('');
    } catch {
      Toast.error('Impossible de créer le tag.');
    } finally {
      setIsCreating(false);
    }
  };

  const exactMatch = allTags.some((t) => t.label.toLowerCase() === search.trim().toLowerCase());
  const showCreate = search.trim().length > 0 && !exactMatch;
  const selectedTags = selectedIds.map((id) => allTags.find((t) => t.id === id)).filter(Boolean) as TagDto[];

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>Tags</AppText>

      <Pressable
        style={[tagStyles.trigger, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="pricetags-outline" size={16} color={colors.textMuted} />
        <AppText
          variant="body"
          style={{ flex: 1, marginLeft: Spacing.sm, color: selectedIds.length ? colors.text : colors.placeholder }}
          numberOfLines={1}
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} tag${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`
            : 'Sélectionner des tags…'}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      {selectedTags.length > 0 && (
        <View style={tagStyles.chips}>
          {selectedTags.map((tag) => (
            <Pressable
              key={tag.id}
              style={[tagStyles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={() => toggle(tag.id)}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>{tag.label}</AppText>
              <Ionicons name="close" size={11} color={colors.primary} style={{ marginLeft: 3 }} />
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={tagStyles.overlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={[tagStyles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[tagStyles.sheetHeader, { borderBottomColor: colors.borderLight }]}>
              <AppText variant="h3">Tags</AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={[tagStyles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} />
              <TextInput
                style={[tagStyles.searchInput, { color: colors.text }]}
                placeholder="Rechercher ou créer un tag…"
                placeholderTextColor={colors.placeholder}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {isLoadingTags ? (
              <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(t) => t.id}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={showCreate ? (
                  <Pressable
                    style={[tagStyles.createRow, { borderBottomColor: colors.borderLight }]}
                    onPress={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    }
                    <AppText variant="body" style={{ color: colors.primary, marginLeft: Spacing.sm, flex: 1 }}>
                      Créer « {search.trim()} »
                    </AppText>
                  </Pressable>
                ) : null}
                ListEmptyComponent={!showCreate ? (
                  <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                    <AppText variant="body" muted>Aucun tag trouvé</AppText>
                  </View>
                ) : null}
                renderItem={({ item }) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <Pressable
                      style={[
                        tagStyles.tagRow,
                        { borderBottomColor: colors.borderLight },
                        isSelected && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => toggle(item.id)}
                    >
                      <AppText variant="body" style={{ flex: 1, color: isSelected ? colors.primary : colors.text }}>
                        {item.label}
                      </AppText>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    margin: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.xs,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 52,
  },
});

// ─── Quiz Question Card ───────────────────────────────────────────────────────

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  hasError: boolean;
  onUpdate: (q: QuizQuestion) => void;
  onDelete: () => void;
}

function QuizQuestionCard({ question, index, hasError, onUpdate, onDelete }: QuizQuestionCardProps) {
  const { colors } = useTheme();

  const updateQuestionText = (text: string) =>
    onUpdate({ ...question, question: text });

  const addAnswer = () => {
    if (question.answers.length >= 6) return;
    onUpdate({ ...question, answers: [...question.answers, { id: generateId(), text: '' }] });
  };

  const updateAnswer = (id: string, text: string) =>
    onUpdate({ ...question, answers: question.answers.map((a) => (a.id === id ? { ...a, text } : a)) });

  const deleteAnswer = (id: string) => {
    const next = question.answers.filter((a) => a.id !== id);
    onUpdate({
      ...question,
      answers: next,
      correctAnswerId: question.correctAnswerId === id ? (next[0]?.id ?? '') : question.correctAnswerId,
    });
  };

  const selectCorrect = (id: string) => onUpdate({ ...question, correctAnswerId: id });

  return (
    <View
      style={[
        quizStyles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasError ? colors.error : colors.border,
          ...quizStyles.cardShadow,
        },
      ]}
    >
      {/* Card header */}
      <View style={[quizStyles.cardHeader, { borderBottomColor: colors.borderLight }]}>
        <View style={[quizStyles.indexBadge, { backgroundColor: colors.primaryLight }]}>
          <AppText style={{ color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {index + 1}
          </AppText>
        </View>
        <AppText variant="label" style={{ flex: 1, marginLeft: Spacing.sm, color: colors.text }}>
          Question {index + 1}
        </AppText>
        <Pressable onPress={onDelete} hitSlop={10} style={quizStyles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color={colors.error} />
        </Pressable>
      </View>

      <View style={quizStyles.cardBody}>
        {/* Question text */}
        <AppTextInput
          label="Énoncé"
          placeholder="Ex : Quelle est la capitale de la France ?"
          value={question.question}
          onChangeText={updateQuestionText}
          multiline
          numberOfLines={2}
          style={{ minHeight: 64, textAlignVertical: 'top' }}
        />

        {/* Answers */}
        <AppText variant="label" style={{ marginBottom: Spacing.sm }}>
          Réponses{' '}
          <AppText variant="caption" muted>
            — appuyez pour marquer la bonne réponse
          </AppText>
        </AppText>

        {question.answers.map((answer, i) => {
          const isCorrect = answer.id === question.correctAnswerId;
          return (
            <Pressable
              key={answer.id}
              onPress={() => selectCorrect(answer.id)}
              style={[
                quizStyles.answerRow,
                {
                  borderColor: isCorrect ? colors.primary : colors.border,
                  backgroundColor: isCorrect ? colors.primaryLight : colors.inputBackground,
                },
              ]}
            >
              <View style={[quizStyles.radioOuter, { borderColor: isCorrect ? colors.primary : colors.border }]}>
                {isCorrect && <View style={[quizStyles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>

              <TextInput
                style={[quizStyles.answerInput, { color: colors.text, flex: 1 }]}
                placeholder={`Réponse ${i + 1}…`}
                placeholderTextColor={colors.placeholder}
                value={answer.text}
                onChangeText={(t) => updateAnswer(answer.id, t)}
                onFocus={() => selectCorrect(answer.id)}
              />

              {question.answers.length > 2 && (
                <Pressable
                  onPress={() => deleteAnswer(answer.id)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={18} color={isCorrect ? colors.primary : colors.textMuted} />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {question.answers.length < 6 && (
          <Pressable
            style={[quizStyles.addAnswerBtn, { borderColor: colors.primary }]}
            onPress={addAnswer}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.primary, marginLeft: 4 }}>
              Ajouter une réponse
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Quiz Questions Builder ────────────────────────────────────────────────────

interface QuizQuestionsBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  error?: string;
}

function QuizQuestionsBuilder({ questions, onChange, error }: QuizQuestionsBuilderProps) {
  const { colors } = useTheme();

  const updateQuestion = (index: number, q: QuizQuestion) => {
    const next = [...questions];
    next[index] = q;
    onChange(next);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    onChange(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => onChange([...questions, makeDefaultQuestion()]);

  const firstErrorIndex = error
    ? questions.findIndex(
        (q) =>
          !q.question.trim() ||
          q.answers.filter((a) => a.text.trim()).length < 2 ||
          !q.answers.find((a) => a.id === q.correctAnswerId && a.text.trim()),
      )
    : -1;

  return (
    <View>
      {/* Section header */}
      <View style={quizStyles.builderHeader}>
        <AppText variant="h3">Questions du quiz</AppText>
        <View style={[quizStyles.countBadge, { backgroundColor: colors.primary }]}>
          <AppText style={{ color: colors.textOnPrimary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {questions.length}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
        Ajoutez au moins 1 question avec 2 réponses possibles.
      </AppText>

      {error && (
        <View style={[quizStyles.errorBanner, { backgroundColor: colors.errorLight ?? '#FFF0F0', borderColor: colors.error }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 6, flex: 1 }}>{error}</AppText>
        </View>
      )}

      {questions.map((q, i) => (
        <QuizQuestionCard
          key={q.id}
          question={q}
          index={i}
          hasError={!!error && i === firstErrorIndex}
          onUpdate={(updated) => updateQuestion(i, updated)}
          onDelete={() => deleteQuestion(i)}
        />
      ))}

      <Pressable
        style={[quizStyles.addQuestionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
        onPress={addQuestion}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <AppText variant="body" style={{ color: colors.primary, marginLeft: Spacing.sm, fontWeight: '600' }}>
          Ajouter une question
        </AppText>
      </Pressable>
    </View>
  );
}

const quizStyles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  cardBody: {
    padding: Spacing.md,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.xs,
    minHeight: 44,
    gap: Spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  answerInput: {
    fontSize: FontSize.base,
    paddingVertical: 2,
  },
  addAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  builderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
});

// ─── Poll Options Builder ─────────────────────────────────────────────────────

interface PollOptionsBuilderProps {
  options: PollOption[];
  onChange: (options: PollOption[]) => void;
  error?: string;
}

function PollOptionsBuilder({ options, onChange, error }: PollOptionsBuilderProps) {
  const { colors } = useTheme();

  const updateOption = (id: string, text: string) =>
    onChange(options.map((o) => (o.id === id ? { ...o, text } : o)));

  const deleteOption = (id: string) => {
    if (options.length <= 2) return;
    onChange(options.filter((o) => o.id !== id));
  };

  const addOption = () => {
    if (options.length >= 10) return;
    onChange([...options, { id: generateId(), text: '' }]);
  };

  return (
    <View>
      <View style={pollStyles.header}>
        <AppText variant="h3">Options du sondage</AppText>
        <View style={[pollStyles.countBadge, { backgroundColor: colors.primary }]}>
          <AppText style={{ color: colors.textOnPrimary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {options.length}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
        Proposez entre 2 et 10 choix aux participants.
      </AppText>

      {error && (
        <View style={[pollStyles.errorBanner, { backgroundColor: colors.errorLight ?? '#FFF0F0', borderColor: colors.error }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 6, flex: 1 }}>{error}</AppText>
        </View>
      )}

      <View style={[pollStyles.optionsCard, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
        {options.map((option, i) => (
          <View
            key={option.id}
            style={[
              pollStyles.optionRow,
              i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[pollStyles.optionIndex, { backgroundColor: colors.primaryLight }]}>
              <AppText style={{ color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' }}>
                {i + 1}
              </AppText>
            </View>

            <TextInput
              style={[pollStyles.optionInput, { color: colors.text, flex: 1 }]}
              placeholder={`Option ${i + 1}…`}
              placeholderTextColor={colors.placeholder}
              value={option.text}
              onChangeText={(t) => updateOption(option.id, t)}
            />

            {options.length > 2 && (
              <Pressable onPress={() => deleteOption(option.id)} hitSlop={10} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {options.length < 10 && (
        <Pressable
          style={[pollStyles.addOptionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          onPress={addOption}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <AppText variant="body" style={{ color: colors.primary, marginLeft: Spacing.sm, fontWeight: '600' }}>
            Ajouter une option
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const pollStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionsCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 52,
  },
  optionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionInput: {
    fontSize: FontSize.base,
    paddingVertical: 2,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
});

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  typeId: string;
  confidentialityTypeId: string;
  tags: string[];
  isVirtual: boolean;
  dateStart: string;
  dateEnd: string;
  location: string;
  eventLink: string;
  content: string;
  thumbnail: ImagePicker.ImagePickerAsset | null;
  quizQuestions: QuizQuestion[];
  pollOptions: PollOption[];
}

interface FormErrors {
  title?: string;
  description?: string;
  typeId?: string;
  confidentialityTypeId?: string;
  dateStart?: string;
  dateEnd?: string;
  location?: string;
  content?: string;
  quizQuestions?: string;
  pollOptions?: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateResourceScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    description: '',
    typeId: '',
    confidentialityTypeId: '',
    tags: [],
    isVirtual: false,
    dateStart: '',
    dateEnd: '',
    location: '',
    eventLink: '',
    content: '',
    thumbnail: null,
    quizQuestions: [makeDefaultQuestion()],
    pollOptions: makeDefaultOptions(),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [localTags, setLocalTags] = useState<TagDto[]>([]);

  const { data: resourceTypes, isLoading: loadingTypes, error: errorTypes } = useQuery(
    ['resource-types'],
    () => resourceService.getResourceTypes(),
  );
  const { data: confidentialityTypes, isLoading: loadingConfTypes, error: errorConfTypes } = useQuery(
    ['confidentiality-types'],
    () => resourceService.getConfidentialityTypes(),
  );
  const { data: statuses, isLoading: isLoadingStatuses, refetch: refetchStatuses } = useQuery(
    ['resource-statuses'],
    () => resourceService.getStatuses(),
  );
  const { data: tagsData, isLoading: loadingTags } = useQuery(
    ['tags-list'],
    () => tagService.getTags({ size: 50 }),
  );

  const allTags: TagDto[] = useMemo(() => {
    const base = tagsData?.items ?? [];
    const localIds = new Set(localTags.map((t) => t.id));
    return [...base.filter((t) => !localIds.has(t.id)), ...localTags];
  }, [tagsData, localTags]);

  const selectedType = resourceTypes?.find((t) => t.id === form.typeId);
  const typeLabel = selectedType?.label ?? '';
  const isEventType = isEventLabel(typeLabel);
  const isArticleType = isArticleLabel(typeLabel);
  const isQuizType = isQuizLabel(typeLabel);
  const isPollType = isPollLabel(typeLabel);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setField('thumbnail', result.assets[0]);
    }
  }, [setField]);

  const validateStep = (): boolean => {
    const next: FormErrors = {};

    if (step === 0) {
      if (!form.title.trim()) next.title = 'Le titre est requis.';
      if (!form.description.trim()) next.description = 'La description est requise.';
    } else if (step === 1) {
      if (!form.typeId) next.typeId = 'Le type de ressource est requis.';
      if (!form.confidentialityTypeId) next.confidentialityTypeId = 'La confidentialité est requise.';
    } else if (step === 2 && isEventType) {
      if (!form.dateStart) next.dateStart = 'La date de début est requise.';
      if (!form.dateEnd) next.dateEnd = 'La date de fin est requise.';
      if (!form.isVirtual && !form.location.trim()) next.location = 'Le lieu est requis.';
    } else if (step === 2 && isArticleType) {
      if (!form.content.trim()) next.content = 'Le contenu est requis.';
    } else if (step === 2 && isQuizType) {
      if (form.quizQuestions.length === 0) {
        next.quizQuestions = 'Ajoutez au moins une question.';
      } else {
        for (const q of form.quizQuestions) {
          if (!q.question.trim()) {
            next.quizQuestions = 'Chaque question doit avoir un énoncé.';
            break;
          }
          if (q.answers.filter((a) => a.text.trim()).length < 2) {
            next.quizQuestions = 'Chaque question doit avoir au moins 2 réponses remplies.';
            break;
          }
          if (!q.answers.find((a) => a.id === q.correctAnswerId && a.text.trim())) {
            next.quizQuestions = 'Sélectionnez la bonne réponse pour chaque question.';
            break;
          }
        }
      }
    } else if (step === 2 && isPollType) {
      const filled = form.pollOptions.filter((o) => o.text.trim());
      if (filled.length < 2) {
        next.pollOptions = 'Renseignez au moins 2 options.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const { mutate: createEvent, isLoading: isSubmittingEvent, error: errorEvent } = useMutation(
    (payload: CreateEventPayload) => eventService.createEvent(payload),
  );
  const { mutate: createArticle, isLoading: isSubmittingArticle, error: errorArticle } = useMutation(
    (payload: CreateArticlePayload) => articleService.createArticle(payload),
  );
  const { mutate: createQuiz, isLoading: isSubmittingQuiz, error: errorQuiz } = useMutation(
    (payload: CreateQuizPayload) => quizService.createQuiz(payload),
  );
  const { mutate: createPoll, isLoading: isSubmittingPoll, error: errorPoll } = useMutation(
    (payload: CreatePollPayload) => pollService.createPoll(payload),
  );

  const isSubmitting = isSubmittingEvent || isSubmittingArticle || isSubmittingQuiz || isSubmittingPoll;

  const handleSubmit = async () => {
    if (isSubmitting || !validateStep()) return;

    const statusId = statuses?.[0]?.id ?? '';
    if (!statusId) {
      await refetchStatuses();
      Toast.error('Impossible de récupérer le statut de publication. Réessayez dans un instant.');
      return;
    }

    const base = {
      title: form.title.trim(),
      description: form.description.trim(),
      statusId,
      confidentialityTypeId: form.confidentialityTypeId,
      typeId: form.typeId,
      tags: form.tags,
      thumbnail: form.thumbnail ?? undefined,
    };

    if (!isEventType && !isArticleType && !isQuizType && !isPollType) {
      Toast.error(`Type de ressource non reconnu (typeId: ${form.typeId}, label: "${typeLabel}").`);
      return;
    }

    let result: unknown = null;

    if (isEventType) {
      result = await createEvent({
        ...base,
        isVirtual: form.isVirtual,
        dateStart: form.dateStart,
        dateEnd: form.dateEnd,
        location: form.isVirtual ? (form.location.trim() || 'En ligne') : form.location.trim(),
        eventLink: form.eventLink.trim() || undefined,
      });
    } else if (isArticleType) {
      result = await createArticle({ ...base, content: form.content.trim() });
    } else if (isQuizType) {
      const quizResult = await createQuiz(base);
      if (quizResult) {
        try {
          for (const q of form.quizQuestions) {
            await quizService.createQuizQuestion({
              question: q.question.trim(),
              possibleAnswers: q.answers.map((a) => a.text.trim()),
              correctAnswer: q.answers.find((a) => a.id === q.correctAnswerId)?.text.trim() ?? '',
              quizzId: quizResult.id,
            });
          }
          result = quizResult;
        } catch {
          Toast.error('Quiz créé, mais certaines questions n\'ont pas pu être enregistrées.');
          router.back();
          return;
        }
      }
    } else if (isPollType) {
      const pollResult = await createPoll(base);
      if (pollResult) {
        try {
          for (const o of form.pollOptions.filter((o) => o.text.trim())) {
            await pollService.createPollOption({ option: o.text.trim(), pollId: pollResult.id });
          }
          result = pollResult;
        } catch {
          Toast.error('Sondage créé, mais certaines options n\'ont pas pu être enregistrées.');
          router.back();
          return;
        }
      }
    }

    if (result) {
      Toast.success('Ressource créée avec succès !');
      router.back();
    } else {
      const mutationError = isEventType ? errorEvent
        : isArticleType ? errorArticle
        : isQuizType ? errorQuiz
        : errorPoll;
      Toast.error(mutationError?.message ?? 'Une erreur est survenue lors de la création.');
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Pressable
          onPress={() => { if (isSubmitting) return; step === 0 ? router.back() : goBack(); }}
          style={styles.backBtn}
          hitSlop={8}
          disabled={isSubmitting}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h3" style={{ flex: 1, marginLeft: Spacing.sm }}>
          Créer une ressource
        </AppText>
      </View>

      <Stepper current={step} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View>
              <AppText variant="h3" style={{ marginBottom: Spacing.lg }}>
                Informations de base
              </AppText>

              <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
                Image de couverture
              </AppText>
              <Pressable
                onPress={pickImage}
                style={[
                  styles.imagePicker,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                {form.thumbnail ? (
                  <>
                    <Image
                      source={{ uri: form.thumbnail.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                      <Ionicons name="camera-outline" size={22} color="#fff" />
                      <AppText style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                        Modifier
                      </AppText>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.textLight} />
                    <AppText variant="caption" muted style={{ marginTop: Spacing.xs }}>
                      Sélectionner une image
                    </AppText>
                  </>
                )}
              </Pressable>

              <AppTextInput
                label="Titre"
                required
                placeholder="Donnez un titre à votre ressource"
                value={form.title}
                onChangeText={(v) => setField('title', v)}
                error={errors.title}
              />
              <AppTextInput
                label="Description"
                required
                placeholder="Décrivez votre ressource..."
                value={form.description}
                onChangeText={(v) => setField('description', v)}
                error={errors.description}
                multiline
                numberOfLines={5}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <AppText variant="h3" style={{ marginBottom: Spacing.lg }}>Catégorisation</AppText>

              {loadingTypes && !errorTypes ? (
                <ActivityIndicator color={colors.primary} style={{ marginBottom: Spacing.md }} />
              ) : (
                <AppSelect
                  label="Type de ressource"
                  placeholder="Sélectionner un type"
                  required
                  options={resourceTypes ?? []}
                  value={form.typeId || null}
                  onChange={(id) => setField('typeId', id)}
                  error={errors.typeId ?? (errorTypes ? 'Impossible de charger les types' : undefined)}
                />
              )}

              {loadingConfTypes && !errorConfTypes ? (
                <ActivityIndicator color={colors.primary} style={{ marginBottom: Spacing.md }} />
              ) : (
                <AppSelect
                  label="Confidentialité"
                  placeholder="Sélectionner la confidentialité"
                  required
                  options={confidentialityTypes ?? []}
                  value={form.confidentialityTypeId || null}
                  onChange={(id) => setField('confidentialityTypeId', id)}
                  error={errors.confidentialityTypeId ?? (errorConfTypes ? 'Impossible de charger les confidentialités' : undefined)}
                />
              )}

              <TagSelector
                allTags={allTags}
                isLoadingTags={loadingTags}
                selectedIds={form.tags}
                onChange={(ids) => setField('tags', ids)}
                onTagCreated={(tag) => setLocalTags((prev) => [...prev, tag])}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              {!isQuizType && !isPollType && (
                <AppText variant="h3" style={{ marginBottom: Spacing.xs }}>
                  {isEventType ? "Détails de l'événement" : isArticleType ? "Contenu de l'article" : 'Détails spécifiques'}
                </AppText>
              )}

              {!isEventType && !isArticleType && !isQuizType && !isPollType && (
                <AppText variant="body" muted style={{ marginTop: Spacing.sm }}>
                  Aucun champ supplémentaire requis pour ce type de ressource.
                </AppText>
              )}

              {isArticleType && (
                <AppTextInput
                  label="Contenu"
                  required
                  placeholder="Rédigez le contenu de votre article..."
                  value={form.content}
                  onChangeText={(v) => setField('content', v)}
                  error={errors.content}
                  multiline
                  numberOfLines={12}
                  style={{ minHeight: 240, textAlignVertical: 'top' }}
                />
              )}

              {isQuizType && (
                <QuizQuestionsBuilder
                  questions={form.quizQuestions}
                  onChange={(qs) => setField('quizQuestions', qs)}
                  error={errors.quizQuestions}
                />
              )}

              {isPollType && (
                <PollOptionsBuilder
                  options={form.pollOptions}
                  onChange={(opts) => setField('pollOptions', opts)}
                  error={errors.pollOptions}
                />
              )}

              {isEventType && (
                <>
                  <View
                    style={[
                      styles.toggleRow,
                      { borderColor: colors.border, backgroundColor: colors.surface, marginTop: Spacing.lg },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText variant="label">Événement en ligne</AppText>
                      <AppText variant="caption" muted>
                        L'événement se déroule à distance
                      </AppText>
                    </View>
                    <Switch
                      value={form.isVirtual}
                      onValueChange={(v) => setField('isVirtual', v)}
                      trackColor={{ true: colors.primary, false: colors.border }}
                      thumbColor={colors.textOnPrimary}
                    />
                  </View>

                  {!form.isVirtual && (
                    <AppTextInput
                      label="Lieu"
                      required
                      placeholder="Ex: Salle A, 12 rue de la Paix, Paris"
                      value={form.location}
                      onChangeText={(v) => setField('location', v)}
                      error={errors.location}
                    />
                  )}

                  {form.isVirtual && (
                    <AppTextInput
                      label="Lien de l'événement"
                      placeholder="https://meet.example.com/..."
                      value={form.eventLink}
                      onChangeText={(v) => setField('eventLink', v)}
                      keyboardType="url"
                    />
                  )}

                  <AppDatePicker
                    label="Date de début"
                    required
                    value={form.dateStart || undefined}
                    onChange={(iso) => setField('dateStart', iso)}
                    error={errors.dateStart}
                  />

                  <AppDatePicker
                    label="Date de fin"
                    required
                    value={form.dateEnd || undefined}
                    onChange={(iso) => setField('dateEnd', iso)}
                    error={errors.dateEnd}
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}>
          {step === 0 ? (
            <AppButton
              label="Suivant"
              variant="primary"
              onPress={goNext}
              fullWidth
            />
          ) : (
            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  label="Précédent"
                  variant="secondary"
                  onPress={goBack}
                  disabled={isSubmitting}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  label={isLastStep ? 'Créer' : 'Suivant'}
                  variant="primary"
                  onPress={isLastStep ? handleSubmit : goNext}
                  loading={isLastStep && (isSubmitting || isLoadingStatuses)}
                  disabled={isSubmitting || (isLastStep && isLoadingStatuses)}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  imagePicker: {
    height: 160,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
