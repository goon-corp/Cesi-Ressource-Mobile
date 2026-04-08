import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';
import type { ApiEvent } from '@/types/resource.types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface EventDetailProps {
  event: ApiEvent;
}

export function EventDetail({ event }: EventDetailProps) {
  const { colors } = useTheme();

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
          <AppText variant="body" style={{ flex: 1, marginLeft: Spacing.sm }} numberOfLines={1}>
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

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});
