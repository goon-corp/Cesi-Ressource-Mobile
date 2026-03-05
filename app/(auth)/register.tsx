import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppAlert } from '@/components/ui/AppAlert';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';
import { ApiError } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FieldErrors {
  email?: string;
  password?: string;
  confirm_password?: string;
  user_name?: string;
  first_name?: string;
  last_name?: string;
}

function validateStep1(
  email: string,
  password: string,
  confirm_password: string,
): Pick<FieldErrors, 'email' | 'password' | 'confirm_password'> {
  const e: FieldErrors = {};
  if (!email) e.email = "L'adresse email est requise";
  else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Adresse email invalide';
  if (!password) e.password = 'Le mot de passe est requis';
  else if (password.length < 8) e.password = 'Minimum 8 caractères';
  if (!confirm_password) e.confirm_password = 'La confirmation est requise';
  else if (password !== confirm_password) e.confirm_password = 'Les mots de passe ne correspondent pas';
  return e;
}

function validateStep2(
  user_name: string,
  first_name: string,
  last_name: string,
): Pick<FieldErrors, 'user_name' | 'first_name' | 'last_name'> {
  const e: FieldErrors = {};
  if (!user_name) e.user_name = "Le nom d'utilisateur est requis";
  else if (user_name.length < 3) e.user_name = "Minimum 3 caractères";
  if (!first_name) e.first_name = 'Le prénom est requis';
  if (!last_name) e.last_name = 'Le nom est requis';
  return e;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
interface StepIndicatorProps {
  current: number;
  total: number;
}

function StepIndicator({ current, total }: StepIndicatorProps) {
  const { colors } = useTheme();
  const STEP_LABELS = ['Compte', 'Profil'];

  return (
    <View style={stepStyles.wrapper}>
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <React.Fragment key={stepNum}>
            <View style={stepStyles.stepItem}>
              <View
                style={[
                  stepStyles.dot,
                  {
                    backgroundColor: isDone || isActive ? colors.primary : colors.backgroundAlt,
                    borderColor: isDone || isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color={colors.textOnPrimary} />
                ) : (
                  <AppText
                    style={{
                      color: isActive ? colors.textOnPrimary : colors.textMuted,
                      fontSize: FontSize.xs,
                      fontWeight: '700',
                    }}
                  >
                    {stepNum}
                  </AppText>
                )}
              </View>
              <AppText
                variant="caption"
                style={{
                  color: isActive ? colors.primary : isDone ? colors.success : colors.textMuted,
                  fontWeight: isActive ? '600' : '400',
                  marginTop: 4,
                }}
              >
                {STEP_LABELS[i]}
              </AppText>
            </View>

            {i < total - 1 && (
              <View
                style={[
                  stepStyles.line,
                  { backgroundColor: isDone ? colors.primary : colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    width: 64,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 15, // center with dot
    marginHorizontal: -4,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    user_name: '',
    first_name: '',
    last_name: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const transition = (direction: 'forward' | 'back', callback: () => void) => {
    const exitX = direction === 'forward' ? -32 : 32;
    const enterX = direction === 'forward' ? 32 : -32;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitX, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    const errors = validateStep1(form.email, form.password, form.confirm_password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    transition('forward', () => setCurrentStep(2));
  };

  const goBack = () => {
    transition('back', () => setCurrentStep(1));
  };

  const handleRegister = async () => {
    const errors = validateStep2(form.user_name, form.first_name, form.last_name);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setApiError('');
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.status === 409 ? 'Cette adresse email est déjà utilisée' : err.message);
      } else {
        setApiError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <AppText
                style={{
                  color: colors.textOnPrimary,
                  fontSize: FontSize['2xl'],
                  fontWeight: FontWeight.bold,
                }}
              >
                RL
              </AppText>
            </View>
            <AppText variant="h2" center style={{ marginTop: Spacing.md }}>
              Créer un compte
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: Spacing.xs }}>
              Rejoignez Ressources Relationnelles
            </AppText>
          </View>

          {/* Step indicator */}
          <StepIndicator current={currentStep} total={2} />

          {/* Animated form */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Step title */}
            <AppText variant="h3" style={{ marginBottom: Spacing.md, color: colors.text }}>
              {currentStep === 1 ? 'Informations de connexion' : 'Votre profil'}
            </AppText>

            {currentStep === 1 ? (
              <>
                <AppTextInput
                  label="Adresse email"
                  placeholder="nom@exemple.fr"
                  value={form.email}
                  onChangeText={(v) => update('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={fieldErrors.email}
                  required
                />
                <AppTextInput
                  label="Mot de passe"
                  placeholder="8 caractères minimum"
                  value={form.password}
                  onChangeText={(v) => update('password', v)}
                  secureTextEntry
                  autoComplete="new-password"
                  error={fieldErrors.password}
                  required
                />
                <AppTextInput
                  label="Confirmer le mot de passe"
                  placeholder="Répétez votre mot de passe"
                  value={form.confirm_password}
                  onChangeText={(v) => update('confirm_password', v)}
                  secureTextEntry
                  autoComplete="new-password"
                  error={fieldErrors.confirm_password}
                  required
                />
                <AppButton label="Suivant" onPress={goNext} />
              </>
            ) : (
              <>
                <AppAlert type="error" message={apiError} visible={!!apiError} />
                <AppTextInput
                  label="Nom d'utilisateur"
                  placeholder="pseudonyme"
                  value={form.user_name}
                  onChangeText={(v) => update('user_name', v)}
                  autoCapitalize="none"
                  autoComplete="username"
                  error={fieldErrors.user_name}
                  required
                />
                <View style={styles.row}>
                  <View style={styles.half}>
                    <AppTextInput
                      label="Prénom"
                      placeholder="Jean"
                      value={form.first_name}
                      onChangeText={(v) => update('first_name', v)}
                      autoComplete="given-name"
                      error={fieldErrors.first_name}
                      required
                    />
                  </View>
                  <View style={styles.half}>
                    <AppTextInput
                      label="Nom"
                      placeholder="Dupont"
                      value={form.last_name}
                      onChangeText={(v) => update('last_name', v)}
                      autoComplete="family-name"
                      error={fieldErrors.last_name}
                      required
                    />
                  </View>
                </View>
                <AppButton
                  label="Créer mon compte"
                  onPress={handleRegister}
                  loading={loading}
                />
                <Pressable onPress={goBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={16} color={colors.primary} />
                  <AppText variant="label" style={{ color: colors.primary, marginLeft: Spacing.xs }}>
                    Retour
                  </AppText>
                </Pressable>
              </>
            )}
          </Animated.View>

          {/* Login link */}
          <View style={styles.footer}>
            <AppText variant="body" muted>
              Déjà un compte ?{' '}
            </AppText>
            <Pressable onPress={() => router.back()}>
              <AppText variant="link" style={{ color: colors.primary }}>
                Se connecter
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  half: {
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
