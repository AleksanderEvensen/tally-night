import '../global.css';
import { ConvexProvider } from 'convex/react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { ThemeProvider } from '@react-navigation/native';
import { useUniwind } from 'uniwind';
import { NAV_THEME } from '@/lib/theme';

import { Stack } from 'expo-router';

import { AppProvider } from '@/lib/context';
import { convexClient } from '@/lib/convex';
import { SyncProvider } from '@/lib/sync';

export { ErrorBoundary } from 'expo-router';

export default function Layout() {
  const { theme } = useUniwind();
  return (
    <ThemeProvider value={NAV_THEME[theme === 'dark' ? 'dark' : 'light']}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ConvexProvider client={convexClient}>
            <AppProvider>
              <SyncProvider>
                <Stack
                  screenOptions={{
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#fff' },
                    contentStyle: { backgroundColor: '#fff' },
                  }}
                />
                <PortalHost />
              </SyncProvider>
            </AppProvider>
          </ConvexProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
