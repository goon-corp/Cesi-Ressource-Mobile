import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/hooks/useTheme';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { Avatar } from '@/components/ui/Avatar';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { ApiError } from '@/services/api';

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  user_name?: string;
}

function validate(first_name: string, last_name: string, user_name: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!first_name.trim()) errors.first_name = 'Le prénom est requis';
  if (!last_name.trim()) errors.last_name = 'Le nom est requis';
  if (!user_name.trim()) errors.user_name = "Le nom d'utilisateur est requis";
  else if (user_name.length < 3) errors.user_name = 'Minimum 3 caractères';
  return errors;
}

export default function EditProfileScreen() {
  const { user, updateUser } = useUser();
  const { colors } = useTheme();

  const [first_name, setFirstName] = useState(user?.first_name ?? '');
  const [last_name, setLastName] = useState(user?.last_name ?? '');
  const [user_name, setUserName] = useState(user?.user_name ?? '');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  if (!user) return null;

  const clearError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const hasChanges =
    first_name !== user.first_name ||
    last_name !== user.last_name ||
    user_name !== user.user_name;

  const handleSave = async () => {
    const errors = validate(first_name, last_name, user_name);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await updateUser({ first_name, last_name, user_name });
      Toast.success('Profil mis à jour avec succès.');
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        Toast.error(err.message);
      } else {
        Toast.error('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Modifier mon profil" onMenuPress={() => router.back()} showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
              <Avatar
                name={`${first_name || user.first_name} ${last_name || user.last_name}`}
                size={80}
                backgroundColor={colors.primaryLight}
                textColor={colors.primary}
              />
            </View>
            <AppText variant="caption" muted style={{ marginTop: Spacing.sm }}>
              {user.email}
            </AppText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText variant="label" muted style={styles.sectionTitle}>
              INFORMATIONS PERSONNELLES
            </AppText>

            <AppTextInput
              label="Prénom"
              placeholder="Votre prénom"
              value={first_name}
              onChangeText={(v) => { setFirstName(v); clearError('first_name'); }}
              autoCapitalize="words"
              error={fieldErrors.first_name}
              required
            />

            <AppTextInput
              label="Nom"
              placeholder="Votre nom"
              value={last_name}
              onChangeText={(v) => { setLastName(v); clearError('last_name'); }}
              autoCapitalize="words"
              error={fieldErrors.last_name}
              required
            />

            <AppTextInput
              label="Nom d'utilisateur"
              placeholder="votre_pseudo"
              value={user_name}
              onChangeText={(v) => { setUserName(v); clearError('user_name'); }}
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldErrors.user_name}
              required
            />

            <AppTextInput
              label="Adresse email"
              value={user.email}
              editable={false}
              hint="L'email ne peut pas être modifié ici."
            />
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Enregistrer les modifications"
              onPress={handleSave}
              loading={loading}
              disabled={!hasChanges}
            />
            <View style={{ marginTop: Spacing.sm }}>
              <AppButton
                label="Annuler"
                onPress={() => router.back()}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  avatarWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 3,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  actions: {
    gap: Spacing.sm,
  },
});
