import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
  correctAnswerId: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function makeDefaultQuestion(): QuizQuestion {
  const a1 = { id: generateId(), text: '' };
  const a2 = { id: generateId(), text: '' };
  return { id: generateId(), question: '', answers: [a1, a2], correctAnswerId: a1.id };
}

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
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasError ? colors.error : colors.border,
          ...styles.cardShadow,
        },
      ]}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.borderLight }]}>
        <View style={[styles.indexBadge, { backgroundColor: colors.primaryLight }]}>
          <AppText style={{ color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {index + 1}
          </AppText>
        </View>
        <AppText variant="label" style={{ flex: 1, marginLeft: Spacing.sm, color: colors.text }}>
          Question {index + 1}
        </AppText>
        <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color={colors.error} />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <AppTextInput
          label="Énoncé"
          placeholder="Ex : Quelle est la capitale de la France ?"
          value={question.question}
          onChangeText={(text) => onUpdate({ ...question, question: text })}
          multiline
          numberOfLines={2}
          style={{ minHeight: 64, textAlignVertical: 'top' }}
        />

        <AppText variant="label" style={{ marginBottom: Spacing.sm }}>
          Réponses{' '}
          <AppText variant="caption" muted>— appuyez pour marquer la bonne réponse</AppText>
        </AppText>

        {question.answers.map((answer, i) => {
          const isCorrect = answer.id === question.correctAnswerId;
          return (
            <Pressable
              key={answer.id}
              onPress={() => selectCorrect(answer.id)}
              style={[
                styles.answerRow,
                {
                  borderColor: isCorrect ? colors.primary : colors.border,
                  backgroundColor: isCorrect ? colors.primaryLight : colors.inputBackground,
                },
              ]}
            >
              <View style={[styles.radioOuter, { borderColor: isCorrect ? colors.primary : colors.border }]}>
                {isCorrect && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <TextInput
                style={[styles.answerInput, { color: colors.text, flex: 1 }]}
                placeholder={`Réponse ${i + 1}…`}
                placeholderTextColor={colors.placeholder}
                value={answer.text}
                onChangeText={(t) => updateAnswer(answer.id, t)}
                onFocus={() => selectCorrect(answer.id)}
              />
              {question.answers.length > 2 && (
                <Pressable onPress={() => deleteAnswer(answer.id)} hitSlop={8} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={isCorrect ? colors.primary : colors.textMuted} />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {question.answers.length < 6 && (
          <Pressable
            style={[styles.addAnswerBtn, { borderColor: colors.primary }]}
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

// ─── Quiz Questions Builder ───────────────────────────────────────────────────

interface QuizQuestionsBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  error?: string;
}

export function QuizQuestionsBuilder({ questions, onChange, error }: QuizQuestionsBuilderProps) {
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
      <View style={styles.builderHeader}>
        <AppText variant="h3">Questions du quiz</AppText>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <AppText style={{ color: colors.textOnPrimary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {questions.length}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
        Ajoutez au moins 1 question avec 2 réponses possibles.
      </AppText>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorLight ?? '#FFF0F0', borderColor: colors.error }]}>
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
        style={[styles.addQuestionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
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

const styles = StyleSheet.create({
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
