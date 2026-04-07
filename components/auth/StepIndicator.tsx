import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { FontSize } from '@/constants/Typography';

const STEP_LABELS = ['Compte', 'Profil'];

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <React.Fragment key={stepNum}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isDone || isActive ? colors.primary : colors.backgroundAlt,
                    borderColor: isDone || isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color={colors.textOnPrimary} />
                ) : (
                  <AppText
                    style={{
                      color: isActive ? colors.textOnPrimary : colors.textMuted,
                      fontSize: FontSize.xs,
                      fontWeight: '700',
                    }}
                  >
                    {stepNum}
                  </AppText>
                )}
              </View>
              <AppText
                variant="caption"
                style={{
                  color: isActive ? colors.primary : isDone ? colors.success : colors.textMuted,
                  fontWeight: isActive ? '600' : '400',
                  marginTop: 4,
                }}
              >
                {STEP_LABELS[i]}
              </AppText>
            </View>

            {i < total - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isDone ? colors.primary : colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    width: 64,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 15,
    marginHorizontal: -4,
  },
});
