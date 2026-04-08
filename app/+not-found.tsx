import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText variant="h2" center>
          404
        </AppText>
        <AppText variant="body" muted center style={{ marginTop: Spacing.sm }}>
          Cette page n'existe pas.
        </AppText>
        <Link href="/" style={styles.link}>
          <AppText variant="link" style={{ color: colors.primary }}>
            Retour à l'accueil
          </AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  link: {
    marginTop: Spacing.lg,
  },
});
