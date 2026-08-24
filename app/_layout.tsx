import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, useColorScheme } from 'react-native';
import { ThemeProvider, lightTheme, darkTheme, useTheme } from '@/theme';
import { useAppStore } from '@/store';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const scheme = useColorScheme();
  const appThemeSetting = useAppStore((s) => s.theme);
  const isLoading = useAppStore((s) => s.isLoading);
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const setLoading = useAppStore((s) => s.setLoading);
  const setDbInitialized = useAppStore((s) => s.setDbInitialized);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const router = useRouter();

  const isDark = appThemeSetting === 'dark' || (appThemeSetting === 'system' && scheme === 'dark');
  const currentTheme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function prepare() {
      try {
        setLoading(true);
        setDbInitialized(true);
        loadSettings();
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  return (
    <ThemeProvider theme={currentTheme}>
      <View style={{ flex: 1, backgroundColor: currentTheme.colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: currentTheme.colors.background },
          }}
        >
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="subject/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="subject/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chapter/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="note/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="note/editor" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="flashcards" options={{ presentation: 'card' }} />
          <Stack.Screen name="quiz" options={{ presentation: 'card' }} />
          <Stack.Screen name="timer" options={{ presentation: 'card' }} />
          <Stack.Screen name="statistics" options={{ presentation: 'card' }} />
          <Stack.Screen name="favorites" options={{ presentation: 'card' }} />
          <Stack.Screen name="bookmarks" options={{ presentation: 'card' }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutInner />;
}
