import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppAlert } from '@/components/ui/AppAlert';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize, FontWeight } from '@/constants/Typography';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/services/api';

export const CONFIRM_ACCOUNT_DEADLINE_KEY = 'confirm_account_deadline';

export default function ConfirmAccountScreen() {
  const { colors } = useTheme();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleConfirm = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;

    setApiError('');
    setLoading(true);
    try {
      await authService.confirmAccount(trimmed);
      await SecureStore.deleteItemAsync(CONFIRM_ACCOUNT_DEADLINE_KEY);
      Toast.success('Compte confirmé ! Vous pouvez maintenant vous connecter.');
      router.replace('/(auth)/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
            </View>
            <AppText variant="h2" center style={{ marginTop: Spacing.md }}>
              Confirmez votre compte
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: Spacing.xs }}>
              Un email de confirmation vous a été envoyé. Collez le token reçu ci-dessous.
            </AppText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppAlert type="error" message={apiError} visible={!!apiError} />

            <AppTextInput
              label="Token de confirmation"
              placeholder="Collez votre token ici"
              value={token}
              onChangeText={(v) => { setToken(v); setApiError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AppButton
              label="Confirmer mon compte"
              onPress={handleConfirm}
              loading={loading}
              disabled={!token.trim()}
            />
          </View>

          <View style={styles.footer}>
            <AppText variant="body" muted>Déjà confirmé ?{' '}</AppText>
            <AppText
              variant="link"
              style={{ color: colors.primary }}
              onPress={() => router.replace('/(auth)/login')}
            >
              Se connecter
            </AppText>
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
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
