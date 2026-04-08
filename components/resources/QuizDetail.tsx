import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { quizService } from '@/services/quiz.service';
import type { ApiQuizzQuestion } from '@/types/resource.types';

interface QuizDetailProps {
  questions: ApiQuizzQuestion[];
  userId: string;
}

export function QuizDetail({ questions, userId }: QuizDetailProps) {
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

  const allAnswered = parsed.length > 0 && parsed.every((q) => answers[q.id] !== undefined);
  const score = submitted
    ? parsed.filter((q) => answers[q.id] === q.correct_answer).length
    : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await Promise.all(questions.map((q) => quizService.participateInQuestion(q.id, userId)));
      setSubmitted(true);
    } catch {
      Toast.error('Erreur lors de la participation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (parsed.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name="help-circle-outline" size={32} color={colors.textLight} />
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
          style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="label" style={{ marginBottom: Spacing.md }}>
            {i + 1}. {q.question}
          </AppText>
          <View style={{ gap: Spacing.sm }}>
            {q.parsedAnswers.map((answer) => {
              const isSelected = answers[q.id] === answer;
              const isCorrect = submitted && answer === q.correct_answer;
              const isWrong = submitted && isSelected && answer !== q.correct_answer;
              return (
                <Pressable
                  key={answer}
                  onPress={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: answer }))}
                  disabled={submitted}
                  style={[
                    styles.answerOption,
                    {
                      borderColor: isCorrect ? colors.success : isWrong ? colors.error : isSelected ? colors.primary : colors.border,
                      backgroundColor: isCorrect ? colors.successLight : isWrong ? (colors.errorLight ?? '#FFF0F0') : isSelected ? colors.primaryLight : colors.inputBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isCorrect ? colors.success : isWrong ? colors.error : isSelected ? colors.primary : colors.border },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: isCorrect ? colors.success : isWrong ? colors.error : colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <AppText variant="body" style={{ flex: 1, marginLeft: Spacing.sm }}>{answer}</AppText>
                  {submitted && isCorrect && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                  {submitted && isWrong && <Ionicons name="close-circle" size={18} color={colors.error} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {submitted ? (
        <View style={[styles.resultBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Ionicons name="trophy-outline" size={28} color={colors.primary} />
          <AppText variant="h3" style={{ color: colors.primary, marginTop: Spacing.sm }}>
            {score} / {parsed.length}
          </AppText>
          <AppText variant="caption" muted center>bonnes réponses</AppText>
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

const styles = StyleSheet.create({
  questionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    padding: Spacing.sm + 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});
