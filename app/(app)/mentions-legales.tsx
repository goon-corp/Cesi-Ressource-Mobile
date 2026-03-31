import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="label" style={{ color: colors.primary, marginBottom: Spacing.xs }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

export default function MentionsLegalesScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Mentions légales" onMenuPress={() => router.back()} showBack />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
          Dernière mise à jour : mars 2026
        </AppText>

        <Section title="Éditeur de l'application">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'application <AppText variant="body" style={{ fontWeight: '600' }}>Ressources Relationnelles</AppText> est éditée dans le cadre d'un projet pédagogique au sein de l'école CESI.
          </AppText>
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginTop: Spacing.xs }}>
            École CESI{'\n'}
            Adresse : 30 Rue Cambronne, 75015 Paris{'\n'}
            Email : contact@cesi.fr
          </AppText>
        </Section>

        <Section title="Hébergement">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'application et ses données sont hébergées sur des serveurs sécurisés conformes aux réglementations en vigueur. Les informations relatives à l'hébergeur seront communiquées lors de la mise en production.
          </AppText>
        </Section>

        <Section title="Directeur de la publication">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Le directeur de la publication est le responsable pédagogique du projet désigné par l'école CESI.
          </AppText>
        </Section>

        <Section title="Propriété intellectuelle">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'ensemble des éléments constituant cette application (textes, images, design, code source) est protégé par les lois relatives à la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, est interdite sans autorisation préalable.
          </AppText>
        </Section>

        <Section title="Limitation de responsabilité">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation de l'application, ni des interruptions ou indisponibilités du service.
          </AppText>
        </Section>

        <Section title="Droit applicable">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront compétents.
          </AppText>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
});
