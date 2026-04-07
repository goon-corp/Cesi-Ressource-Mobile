import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';

export interface SelectOption {
  id: string;
  label: string;
}

interface AppSelectProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  required?: boolean;
  error?: string;
}

export function AppSelect({ label, placeholder, options, value, onChange, required, error }: AppSelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
        {label}
        {required ? <AppText style={{ color: colors.error }}> *</AppText> : null}
      </AppText>

      <Pressable
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.error : colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <AppText
          variant="body"
          style={{ flex: 1, color: selected ? colors.text : colors.placeholder }}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 4 }}>{error}</AppText>
        </View>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.borderLight }]}>
              <AppText variant="h3">{label}</AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => o.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.id === value && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => { onChange(item.id); setOpen(false); }}
                >
                  <AppText
                    variant="body"
                    style={{ color: item.id === value ? colors.primary : colors.text }}
                  >
                    {item.label}
                  </AppText>
                  {item.id === value ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
