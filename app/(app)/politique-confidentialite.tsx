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

function BulletItem({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bullet}>
      <AppText variant="body" style={{ color: colors.primary, marginRight: Spacing.xs }}>•</AppText>
      <AppText variant="body" style={{ flex: 1, color: colors.text, lineHeight: 22 }}>{text}</AppText>
    </View>
  );
}

export default function PolitiqueConfidentialiteScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Politique de confidentialité" onMenuPress={() => router.back()} showBack />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
          Dernière mise à jour : mars 2026
        </AppText>

        <Section title="Introduction">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'application Ressources Relationnelles s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit comment nous collectons, utilisons et protégeons vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).
          </AppText>
        </Section>

        <Section title="Données collectées">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginBottom: Spacing.xs }}>
            Lors de l'inscription et de l'utilisation de l'application, nous collectons les données suivantes :
          </AppText>
          <BulletItem text="Nom et prénom" />
          <BulletItem text="Nom d'utilisateur" />
          <BulletItem text="Adresse email" />
          <BulletItem text="Données de connexion (date, heure, adresse IP)" />
          <BulletItem text="Contenus publiés (ressources, commentaires)" />
        </Section>

        <Section title="Finalités du traitement">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginBottom: Spacing.xs }}>
            Vos données sont traitées pour :
          </AppText>
          <BulletItem text="Gérer votre compte et votre authentification" />
          <BulletItem text="Vous permettre d'accéder aux fonctionnalités de la plateforme" />
          <BulletItem text="Assurer la sécurité de l'application" />
          <BulletItem text="Améliorer les services proposés" />
        </Section>

        <Section title="Base légale">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Le traitement de vos données repose sur votre consentement lors de l'inscription, ainsi que sur l'exécution du contrat de service liant l'utilisateur à la plateforme.
          </AppText>
        </Section>

        <Section title="Durée de conservation">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Vos données sont conservées pendant toute la durée de votre utilisation de l'application, et supprimées dans un délai de 30 jours suivant la suppression de votre compte.
          </AppText>
        </Section>

        <Section title="Vos droits">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginBottom: Spacing.xs }}>
            Conformément au RGPD, vous disposez des droits suivants :
          </AppText>
          <BulletItem text="Droit d'accès à vos données" />
          <BulletItem text="Droit de rectification" />
          <BulletItem text="Droit à l'effacement (« droit à l'oubli »)" />
          <BulletItem text="Droit à la portabilité des données" />
          <BulletItem text="Droit d'opposition au traitement" />
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginTop: Spacing.xs }}>
            Pour exercer ces droits, contactez-nous à : contact@cesi.fr
          </AppText>
        </Section>

        <Section title="Sécurité">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou destruction.
          </AppText>
        </Section>

        <Section title="Contact">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Pour toute question relative à cette politique, vous pouvez nous contacter à l'adresse : contact@cesi.fr
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
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
});
