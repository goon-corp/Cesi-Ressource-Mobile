import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={[styles.box, { backgroundColor: colors.surface }]}>
          <AppText variant="h3" style={{ marginBottom: Spacing.sm }}>
            {title}
          </AppText>
          <AppText variant="body" muted style={{ marginBottom: Spacing.lg }}>
            {message}
          </AppText>
          <View style={{ gap: Spacing.sm }}>
            <AppButton label={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} />
            <AppButton label="Annuler" variant="secondary" onPress={onCancel} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  box: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
});
