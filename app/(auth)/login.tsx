import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppAlert } from '@/components/ui/AppAlert';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';
import { ApiError } from '@/services/api';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = "L'adresse email est requise";
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Adresse email invalide';
  if (!password) errors.password = 'Le mot de passe est requis';
  return errors;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleLogin = async () => {
    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setApiError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(
          err.status === 401
            ? 'Email ou mot de passe incorrect'
            : err.message,
        );
      } else {
        console.error(err);
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
              Connexion
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: Spacing.xs }}>
              Accédez à votre espace personnel
            </AppText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {apiError ? <AppAlert type="error" message={apiError} visible /> : null}

            <AppTextInput
              label="Adresse email"
              placeholder="nom@exemple.fr"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
              required
            />

            <AppTextInput
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearFieldError('password');
              }}
              secureTextEntry
              autoComplete="current-password"
              error={fieldErrors.password}
              required
            />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
            >
              <AppText variant="link" style={{ color: colors.primary }}>
                Mot de passe oublié ?
              </AppText>
            </Pressable>

            <AppButton label="Se connecter" onPress={handleLogin} loading={loading} />
          </View>

          <View style={styles.footer}>
            <AppText variant="body" muted>
              Pas encore de compte ?{' '}
            </AppText>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <AppText variant="link" style={{ color: colors.primary }}>
                Créer un compte
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});