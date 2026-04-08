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

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setEmailError("L'adresse email est requise");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Adresse email invalide');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // On ne révèle pas si l'email existe ou non
    } finally {
      setLoading(false);
      setSubmitted(true);
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
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <AppText variant="label" style={{ color: colors.primary, marginLeft: Spacing.xs }}>
              Retour
            </AppText>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
            </View>
            <AppText variant="h2" center style={{ marginTop: Spacing.md }}>
              Mot de passe oublié
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: Spacing.xs }}>
              Saisissez votre adresse email pour réinitialiser votre mot de passe.
            </AppText>
          </View>

          {/* Form / Confirmation */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {submitted ? (
              <View style={styles.successContainer}>
                <AppAlert
                  type="success"
                  title="Email envoyé"
                  message="Si un compte est associé à cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe."
                  visible
                />
                <AppButton
                  label="Retour à la connexion"
                  onPress={() => router.replace('/(auth)/login')}
                  variant="secondary"
                />
              </View>
            ) : (
              <>
                <AppTextInput
                  label="Adresse email"
                  placeholder="nom@exemple.fr"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={emailError}
                  required
                />

                <AppButton
                  label="Envoyer le lien de réinitialisation"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </>
            )}
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  successContainer: {
    gap: Spacing.sm,
  },
});
