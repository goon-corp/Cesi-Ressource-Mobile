import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import type { ReportTypeDto } from '@/types/resource.types';

interface ReportModalProps {
  visible: boolean;
  reportTypes: ReportTypeDto[];
  loadingTypes: boolean;
  submitting: boolean;
  onSelect: (reportTypeId: string) => void;
  onClose: () => void;
}

export function ReportModal({
  visible,
  reportTypes,
  loadingTypes,
  submitting,
  onSelect,
  onClose,
}: ReportModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.box, { backgroundColor: colors.surface }]}>
          <AppText variant="h3" style={{ marginBottom: Spacing.sm }}>
            Signaler la ressource
          </AppText>
          <AppText variant="body" muted style={{ marginBottom: Spacing.md }}>
            Choisissez un motif de signalement.
          </AppText>
          {loadingTypes ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {reportTypes.map((type) => (
                <AppButton
                  key={type.id}
                  label={type.label}
                  variant="secondary"
                  onPress={() => onSelect(type.id)}
                  loading={submitting}
                  disabled={submitting}
                />
              ))}
            </View>
          )}
          <View style={{ marginTop: Spacing.md }}>
            <AppButton label="Annuler" variant="danger" onPress={onClose} disabled={submitting} />
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
