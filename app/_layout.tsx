import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import ToastManager from 'toastify-react-native';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_DURATION = 2000;

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = isLoading || !minDelayDone;

  // Hide the native splash as soon as auth resolves so our custom screen is visible
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (showSplash) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [isAuthenticated, showSplash, segments, router]);

  if (showSplash) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <RootNavigator />
          <ToastManager />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
