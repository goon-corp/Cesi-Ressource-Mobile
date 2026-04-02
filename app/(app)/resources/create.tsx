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
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(
    () => allTags.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())),
    [allTags, search],
  );

  const toggleTag = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
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

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>Tags</AppText>

      {selectedIds.length > 0 && (
        <View style={tagStyles.selectedRow}>
          {selectedIds.map((id) => {
            const tag = allTags.find((t) => t.id === id);
            return tag ? (
              <Pressable
                key={id}
                style={[tagStyles.selectedTag, { backgroundColor: colors.primary }]}
                onPress={() => toggleTag(id)}
              >
                <AppText variant="caption" style={{ color: colors.textOnPrimary }}>{tag.label}</AppText>
                <Ionicons name="close" size={12} color={colors.textOnPrimary} style={{ marginLeft: 4 }} />
              </Pressable>
            ) : null;
          })}
        </View>
      )}

      <View style={[tagStyles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Ionicons name="search-outline" size={16} color={colors.placeholder} />
        <TextInput
          style={[tagStyles.searchInput, { color: colors.text }]}
          placeholder="Rechercher ou créer un tag..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {showCreate && (
        <Pressable
          style={[tagStyles.createBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <AppText variant="caption" style={{ color: colors.primary, marginLeft: 4 }}>
                Créer "{search.trim()}"
              </AppText>
            </>
          )}
        </Pressable>
      )}

      {isLoadingTags ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : (
        <View style={tagStyles.tagList}>
          {filtered.map((tag) => {
            const isSelected = selectedIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                style={[
                  tagStyles.tagItem,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleTag(tag.id)}
              >
                <AppText variant="caption" style={{ color: isSelected ? colors.textOnPrimary : colors.text }}>
                  {tag.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.xs,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tagItem: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
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
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateResourceScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
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
  });
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
  const { data: statuses } = useQuery(
    ['resource-statuses'],
    () => resourceService.getStatuses(),
  );
  const { data: tagsData, isLoading: loadingTags } = useQuery(
    ['tags-list'],
    () => tagService.getTags({ size: 50 }),
  );

  const allTags: TagDto[] = useMemo(() => {
    const base = Array.isArray(tagsData) ? tagsData : [];
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
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const { mutate: createEvent, isLoading: isSubmittingEvent } = useMutation(
    (payload: CreateEventPayload) => eventService.createEvent(payload),
  );
  const { mutate: createArticle, isLoading: isSubmittingArticle } = useMutation(
    (payload: CreateArticlePayload) => articleService.createArticle(payload),
  );
  const { mutate: createQuiz, isLoading: isSubmittingQuiz } = useMutation(
    (payload: CreateQuizPayload) => quizService.createQuiz(payload),
  );
  const { mutate: createPoll, isLoading: isSubmittingPoll } = useMutation(
    (payload: CreatePollPayload) => pollService.createPoll(payload),
  );

  const isSubmitting = isSubmittingEvent || isSubmittingArticle || isSubmittingQuiz || isSubmittingPoll;

  const handleSubmit = async () => {
    if (isSubmitting || !validateStep()) return;

    const statusId = statuses?.[0]?.id ?? '';
    if (!statusId) {
      Toast.error('Impossible de récupérer le statut de publication.');
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
      result = await createQuiz(base);
    } else if (isPollType) {
      result = await createPoll(base);
    }

    if (result) {
      Toast.success('Ressource créée avec succès !');
      router.back();
    } else {
      Toast.error('Une erreur est survenue lors de la création.');
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
              <AppText variant="h3" style={{ marginBottom: Spacing.xs }}>
                {isEventType ? "Détails de l'événement" : isArticleType ? "Contenu de l'article" : 'Détails spécifiques'}
              </AppText>

              {!isEventType && !isArticleType && (
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
                  loading={isLastStep && isSubmitting}
                  disabled={isSubmitting}
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
