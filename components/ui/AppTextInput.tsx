import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

interface AppTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AppTextInput({
  label,
  error,
  hint,
  required = false,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}: AppTextInputProps) {
  const { colors } = useTheme();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setFocused] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.inputBorderFocus
      : colors.inputBorder;

  return (
    <View style={styles.container}>
      <AppText variant="label" style={{ color: colors.text, marginBottom: Spacing.xs }}>
        {label}
        {required && (
          <AppText style={{ color: colors.error }}> *</AppText>
        )}
      </AppText>

      <View
        style={[
          styles.inputWrapper,
          { borderColor, backgroundColor: colors.inputBackground },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            style={styles.eyeButton}
            accessibilityLabel={
              isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            hitSlop={8}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 4 }}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" muted style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    minHeight: 44,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  hint: {
    marginTop: Spacing.xs,
  },
});
