import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { LegalSection, BulletItem } from '@/components/legal/LegalSection';
import { Spacing } from '@/constants/Spacing';

export default function ConditionsUtilisationScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppHeader title="Conditions d'utilisation" onMenuPress={() => router.back()} showBack />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
          Dernière mise à jour : mars 2026
        </AppText>

        <LegalSection title="Objet">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de l'application <AppText variant="body" style={{ fontWeight: '600' }}>Ressources Relationnelles</AppText>, plateforme de partage de ressources relationnelles développée dans un cadre pédagogique au sein de l'école CESI.
          </AppText>
        </LegalSection>

        <LegalSection title="Accès au service">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'accès à certaines fonctionnalités de l'application est réservé aux utilisateurs ayant créé un compte. L'inscription est ouverte à toute personne disposant d'une adresse email valide.
          </AppText>
        </LegalSection>

        <LegalSection title="Obligations de l'utilisateur">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginBottom: Spacing.xs }}>
            En utilisant l'application, l'utilisateur s'engage à :
          </AppText>
          <BulletItem text="Fournir des informations exactes lors de l'inscription" />
          <BulletItem text="Ne pas usurper l'identité d'une autre personne" />
          <BulletItem text="Ne pas publier de contenu illicite, offensant ou contraire aux bonnes mœurs" />
          <BulletItem text="Ne pas tenter de porter atteinte à la sécurité de la plateforme" />
          <BulletItem text="Respecter les droits des autres utilisateurs" />
        </LegalSection>

        <LegalSection title="Contenus publiés">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'utilisateur est seul responsable des contenus qu'il publie sur la plateforme. En publiant du contenu, l'utilisateur accorde à la plateforme une licence non-exclusive d'affichage et de diffusion au sein de l'application.
          </AppText>
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginTop: Spacing.xs }}>
            La plateforme se réserve le droit de supprimer tout contenu jugé inapproprié, sans préavis.
          </AppText>
        </LegalSection>

        <LegalSection title="Compte utilisateur">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. Toute utilisation frauduleuse signalée sera traitée dans les meilleurs délais.
          </AppText>
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22, marginTop: Spacing.xs }}>
            La plateforme se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.
          </AppText>
        </LegalSection>

        <LegalSection title="Disponibilité du service">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            La plateforme s'efforce d'assurer la disponibilité continue du service. Des interruptions ponctuelles peuvent intervenir pour des raisons de maintenance ou techniques. Aucune garantie de disponibilité n'est contractuellement engagée dans ce cadre pédagogique.
          </AppText>
        </LegalSection>

        <LegalSection title="Modification des CGU">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification significative. La poursuite de l'utilisation de l'application après modification vaut acceptation des nouvelles conditions.
          </AppText>
        </LegalSection>

        <LegalSection title="Droit applicable">
          <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
            Les présentes conditions sont régies par le droit français. Tout litige sera soumis à la compétence des tribunaux français.
          </AppText>
        </LegalSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
