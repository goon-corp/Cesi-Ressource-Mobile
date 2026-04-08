import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { pollService } from '@/services/poll.service';
import type { ApiPoll, ApiPollOption } from '@/types/resource.types';

interface PollDetailProps {
  options: ApiPollOption[];
  poll: ApiPoll;
}

export function PollDetail({ options, poll }: PollDetailProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (!selectedId) return;
    setVoting(true);
    try {
      await pollService.voteForOption(selectedId);
      setVoted(true);
    } catch {
      Toast.error('Erreur lors du vote.');
    } finally {
      setVoting(false);
    }
  };

  if (options.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.textLight} />
        <AppText variant="body" muted center style={{ marginTop: Spacing.sm }}>
          Aucune option disponible.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => !voted && setSelectedId(option.id)}
              disabled={voted}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground,
                },
              ]}
            >
              <View style={[styles.radioOuter, { borderColor: isSelected ? colors.primary : colors.border }]}>
                {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: Spacing.sm }}>{option.option}</AppText>
            </Pressable>
          );
        })}
      </View>

      {voted ? (
        <View style={[styles.resultBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <AppText variant="body" style={{ color: colors.success, marginLeft: Spacing.sm }}>
            Vote enregistré — {poll.vote_count + 1} vote(s) au total
          </AppText>
        </View>
      ) : (
        <AppButton
          label="Voter"
          variant="primary"
          onPress={handleVote}
          loading={voting}
          disabled={!selectedId || voting}
          fullWidth
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    padding: Spacing.sm + 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});
