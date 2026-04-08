import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// ─── Wheel ────────────────────────────────────────────────────────────────────

interface WheelProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function Wheel({ items, selectedIndex, onSelect }: WheelProps) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList>(null);
  const padding = Math.floor(VISIBLE_ITEMS / 2);

  const padded = useMemo(
    () => [...Array(padding).fill(''), ...items, ...Array(padding).fill('')],
    [items, padding],
  );

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: selectedIndex, animated: false });
  }, [selectedIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const centerIdx = Math.floor(viewableItems.length / 2);
      const mid = viewableItems[centerIdx];
      if (mid?.index != null) {
        const real = mid.index - padding;
        if (real >= 0 && real < items.length && real !== selectedIndex) {
          onSelect(real);
        }
      }
    },
    [items.length, onSelect, padding, selectedIndex],
  );

  const viewConfig = useRef({ itemVisiblePercentThreshold: 80, minimumViewTime: 50 });

  return (
    <View style={{ width: 72, height: PICKER_HEIGHT, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={padded}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => {
          const real = index - padding;
          const isSelected = real === selectedIndex;
          return (
            <Pressable
              style={styles.wheelItem}
              onPress={() => real >= 0 && real < items.length && onSelect(real)}
            >
              <AppText
                style={{
                  fontSize: isSelected ? FontSize.md : FontSize.base,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? colors.primary : colors.textMuted,
                  textAlign: 'center',
                }}
              >
                {item}
              </AppText>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig.current}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
      <View
        style={[
          styles.selectionBar,
          { top: ITEM_HEIGHT * padding, borderColor: colors.primary },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00Z`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseIso(iso: string | undefined): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ─── Public component ─────────────────────────────────────────────────────────

interface AppDatePickerProps {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function AppDatePicker({ label, value, onChange, required, error, hint }: AppDatePickerProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const initial = parseIso(value);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [day, setDay] = useState(initial.getDate());
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 11 }, (_, i) => String(currentYear + i)),
    [currentYear],
  );
  const months = MONTHS;
  const days = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => pad(i + 1)),
    [year, month],
  );
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => pad(i)), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => pad(i * 5)), []);

  const clampedDay = Math.min(day, daysInMonth(year, month));

  const handleOpen = () => {
    const d = parseIso(value);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setDay(d.getDate());
    setHour(d.getHours());
    const raw = d.getMinutes();
    setMinute(Math.round(raw / 5) * 5);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(toIso(year, month, clampedDay, hour, Math.round(minute / 5) * 5));
    setOpen(false);
  };

  const displayValue = value
    ? parseIso(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const borderColor = error ? colors.error : colors.inputBorder;

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <AppText variant="label" style={{ marginBottom: Spacing.xs }}>
        {label}
        {required ? <AppText style={{ color: colors.error }}> *</AppText> : null}
      </AppText>

      <Pressable
        style={[styles.trigger, { borderColor, backgroundColor: colors.inputBackground }]}
        onPress={handleOpen}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
        <AppText
          variant="body"
          style={{ flex: 1, marginLeft: Spacing.sm, color: displayValue ? colors.text : colors.placeholder }}
        >
          {displayValue ?? 'Sélectionner une date et heure'}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <AppText variant="caption" style={{ color: colors.error, marginLeft: 4 }}>{error}</AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" muted style={{ marginTop: Spacing.xs }}>{hint}</AppText>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.borderLight }]}>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <AppText variant="body" style={{ color: colors.textMuted }}>Annuler</AppText>
              </Pressable>
              <AppText variant="label">{label}</AppText>
              <Pressable onPress={handleConfirm} hitSlop={8}>
                <AppText variant="body" style={{ color: colors.primary, fontWeight: '700' }}>OK</AppText>
              </Pressable>
            </View>

            <View style={styles.wheelsRow}>
              <View style={styles.wheelCol}>
                <AppText variant="caption" muted style={styles.wheelLabel}>Jour</AppText>
                <Wheel
                  items={days}
                  selectedIndex={clampedDay - 1}
                  onSelect={(i) => setDay(i + 1)}
                />
              </View>

              <View style={styles.wheelCol}>
                <AppText variant="caption" muted style={styles.wheelLabel}>Mois</AppText>
                <Wheel
                  items={months}
                  selectedIndex={month - 1}
                  onSelect={(i) => setMonth(i + 1)}
                />
              </View>

              <View style={styles.wheelCol}>
                <AppText variant="caption" muted style={styles.wheelLabel}>Année</AppText>
                <Wheel
                  items={years}
                  selectedIndex={years.indexOf(String(year))}
                  onSelect={(i) => setYear(currentYear + i)}
                />
              </View>

              <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

              <View style={styles.wheelCol}>
                <AppText variant="caption" muted style={styles.wheelLabel}>Heure</AppText>
                <Wheel
                  items={hours}
                  selectedIndex={hour}
                  onSelect={(i) => setHour(i)}
                />
              </View>

              <View style={styles.wheelCol}>
                <AppText variant="caption" muted style={styles.wheelLabel}>Min</AppText>
                <Wheel
                  items={minutes}
                  selectedIndex={Math.round(minute / 5)}
                  onSelect={(i) => setMinute(i * 5)}
                />
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    gap: 2,
  },
  wheelCol: {
    alignItems: 'center',
  },
  wheelLabel: {
    marginBottom: Spacing.xs,
    fontSize: FontSize.xs,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  selectionBar: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  separator: {
    width: 1,
    height: PICKER_HEIGHT,
    marginHorizontal: Spacing.xs,
  },
});
