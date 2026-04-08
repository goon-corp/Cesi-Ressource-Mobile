import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useQuery } from '@/hooks/useQuery';
import { useMutation } from '@/hooks/useMutation';
import { resourceService } from '@/services/resource.service';
import { tagService } from '@/services/tag.service';
import { eventService, type CreateEventPayload } from '@/services/event.service';
import { articleService, type CreateArticlePayload } from '@/services/article.service';
import { quizService, type CreateQuizPayload } from '@/services/quiz.service';
import { pollService, type CreatePollPayload } from '@/services/poll.service';
import type { TagDto } from '@/types/resource.types';
import { Stepper, STEPS } from '@/components/resources/Stepper';
import { AppSelect } from '@/components/resources/AppSelect';
import { TagSelector } from '@/components/resources/TagSelector';
import { QuizQuestionsBuilder, type QuizQuestion, makeDefaultQuestion } from '@/components/resources/QuizQuestionsBuilder';
import { PollOptionsBuilder, type PollOption, makeDefaultOptions } from '@/components/resources/PollOptionsBuilder';

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
