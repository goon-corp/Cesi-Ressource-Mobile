import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { DrawerProvider, useDrawer } from '@/contexts/DrawerContext';
import { DrawerMenu } from '@/components/layout/DrawerMenu';
import { useTheme } from '@/hooks/useTheme';

function AppLayoutInner() {
  const { isOpen, closeDrawer } = useDrawer();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack screenOptions={{ headerShown: false }} />
      <DrawerMenu isOpen={isOpen} onClose={closeDrawer} />
    </View>
  );
}

export default function AppLayout() {
  return (
    <DrawerProvider>
      <AppLayoutInner />
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
