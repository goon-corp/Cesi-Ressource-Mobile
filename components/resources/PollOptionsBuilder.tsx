import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export interface PollOption {
  id: string;
  text: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function makeDefaultOptions(): PollOption[] {
  return [{ id: generateId(), text: '' }, { id: generateId(), text: '' }];
}

interface PollOptionsBuilderProps {
  options: PollOption[];
  onChange: (options: PollOption[]) => void;
  error?: string;
}

export function PollOptionsBuilder({ options, onChange, error }: PollOptionsBuilderProps) {
  const { colors } = useTheme();

  const updateOption = (id: string, text: string) =>
    onChange(options.map((o) => (o.id === id ? { ...o, text } : o)));

  const deleteOption = (id: string) => {
    if (options.length <= 2) return;
    onChange(options.filter((o) => o.id !== id));
  };

  const addOption = () => {
    if (options.length >= 10) return;
    onChange([...options, { id: generateId(), text: '' }]);
  };

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="h3">Options du sondage</AppText>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <AppText style={{ color: colors.textOnPrimary, fontSize: FontSize.xs, fontWeight: '700' }}>
            {options.length}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" muted style={{ marginBottom: Spacing.lg }}>
        Proposez entre 2 et 10 choix aux participants.
      </AppText>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorLight ?? '#FFF0F0', borderColor: colors.error }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 6, flex: 1 }}>{error}</AppText>
        </View>
      )}

      <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
        {options.map((option, i) => (
          <View
            key={option.id}
            style={[
              styles.optionRow,
              i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[styles.optionIndex, { backgroundColor: colors.primaryLight }]}>
              <AppText style={{ color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' }}>
                {i + 1}
              </AppText>
            </View>
            <TextInput
              style={[styles.optionInput, { color: colors.text, flex: 1 }]}
              placeholder={`Option ${i + 1}…`}
              placeholderTextColor={colors.placeholder}
              value={option.text}
              onChangeText={(t) => updateOption(option.id, t)}
            />
            {options.length > 2 && (
              <Pressable onPress={() => deleteOption(option.id)} hitSlop={10} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {options.length < 10 && (
        <Pressable
          style={[styles.addOptionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          onPress={addOption}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <AppText variant="body" style={{ color: colors.primary, marginLeft: Spacing.sm, fontWeight: '600' }}>
            Ajouter une option
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionsCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 52,
  },
  optionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionInput: {
    fontSize: FontSize.base,
    paddingVertical: 2,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
});
