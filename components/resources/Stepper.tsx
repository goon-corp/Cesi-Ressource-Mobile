import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export const STEPS = ['Infos', 'Catégories', 'Détails'];

interface StepperProps {
  current: number;
}

export function Stepper({ current }: StepperProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.stepWrapper}>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: i <= current ? colors.primary : colors.surface,
                  borderColor: i <= current ? colors.primary : colors.border,
                },
              ]}
            >
              {i < current ? (
                <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
              ) : (
                <AppText
                  style={{
                    color: i === current ? colors.textOnPrimary : colors.textMuted,
                    fontSize: FontSize.xs,
                    fontWeight: '700',
                  }}
                >
                  {i + 1}
                </AppText>
              )}
            </View>
            <AppText variant="caption" muted style={{ marginTop: 4, textAlign: 'center' }}>
              {label}
            </AppText>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={[
                styles.line,
                { backgroundColor: i < current ? colors.primary : colors.border },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 13,
  },
});
