import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { useQuery } from '@/hooks/useQuery';
import { eventService } from '@/services/event.service';
import type { ApiEvent } from '@/types/resource.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLabel(label: string): string {
  return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isEventLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n.includes('event') || n.includes('venement');
}

type ResourceFetcher = () => Promise<ApiEvent>;

function getResourceFetcher(resourceType: string, id: string): ResourceFetcher | null {
  if (isEventLabel(resourceType)) {
    return () => eventService.getEventByResourceId(id);
  }
  return null;
}

// ─── Event Detail ─────────────────────────────────────────────────────────────

function EventDetail({ event }: { event: ApiEvent }) {
  const { colors } = useTheme();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <View>
      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons
          name={event.is_virtual ? 'globe-outline' : 'location-outline'}
          size={18}
          color={colors.primary}
        />
        <AppText variant="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
          {event.is_virtual ? 'Événement en ligne' : event.location}
        </AppText>
      </View>

      {event.is_virtual && event.event_link ? (
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Ionicons name="link-outline" size={18} color={colors.primary} />
          <AppText
            variant="body"
            style={{ flex: 1, marginLeft: Spacing.sm }}
            numberOfLines={1}
          >
            {event.event_link}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="caption" muted>Début</AppText>
          <AppText variant="body">{formatDate(event.date_start)}</AppText>
        </View>
      </View>

      <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.info} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="caption" muted>Fin</AppText>
          <AppText variant="body">{formatDate(event.date_end)}</AppText>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResourceDetailScreen() {
  const { id, resourceType } = useLocalSearchParams<{ id: string; resourceType: string }>();
  const { colors } = useTheme();

  const fetcher = id && resourceType ? getResourceFetcher(resourceType, id) : null;

  const { data, isLoading, error } = useQuery(
    ['resource-detail', id, resourceType],
    fetcher ?? (() => Promise.resolve(null as unknown as ApiEvent)),
    { enabled: !!fetcher },
  );

  const resource = data?.ressource ?? null;

  const renderContent = () => {
    if (!fetcher) {
      return (
        <View style={styles.centered}>
          <Ionicons name="construct-outline" size={48} color={colors.textLight} />
          <AppText variant="body" muted center style={{ marginTop: Spacing.md }}>
            Ce type de ressource n'est pas encore pris en charge.
          </AppText>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error || !data) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <AppText variant="body" muted center style={{ marginTop: Spacing.md }}>
            Impossible de charger la ressource.
          </AppText>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {resourceType ? (
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
            <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
              {resourceType}
            </AppText>
          </View>
        ) : null}

        <AppText variant="h2" style={{ marginBottom: Spacing.sm }}>
          {resource?.title ?? ''}
        </AppText>

        <View style={styles.metaBadges}>
          {resource?.confidentiality_type ? (
            <View style={[styles.badge, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <Ionicons name="shield-outline" size={13} color={colors.textMuted} />
              <AppText variant="caption" muted style={{ marginLeft: 4 }}>
                {resource.confidentiality_type.label}
              </AppText>
            </View>
          ) : null}
          {resource?.status ? (
            <View style={[styles.badge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <AppText variant="caption" style={{ color: colors.success }}>
                {resource.status.label}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
          <AppText variant="label" style={{ marginBottom: Spacing.xs }}>Description</AppText>
          <AppText variant="body">{resource?.description ?? ''}</AppText>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
          <AppText variant="label" style={{ marginBottom: Spacing.md }}>
            Informations spécifiques
          </AppText>
          {isEventLabel(resourceType ?? '') ? (
            <EventDetail event={data} />
          ) : null}
        </View>

        {resource?.tags && resource.tags.length > 0 ? (
          <View style={[styles.section, { borderTopColor: colors.borderLight }]}>
            <AppText variant="label" style={{ marginBottom: Spacing.sm }}>Tags</AppText>
            <View style={styles.tagsRow}>
              {resource.tags.map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.tagChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <AppText variant="caption" style={{ color: colors.primary }}>{tag.label}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h3" numberOfLines={1} style={{ flex: 1, marginLeft: Spacing.sm }}>
          {resource?.title ?? 'Détails'}
        </AppText>
      </View>

      {renderContent()}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  metaBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
