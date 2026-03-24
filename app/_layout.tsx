import '../global.css';
import { ConvexProvider } from 'convex/react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { AppProvider } from '@/lib/context';
import { convexClient } from '@/lib/convex';
import { SyncProvider } from '@/lib/sync';

export default function Layout() {
  return (
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
            </SyncProvider>
          </AppProvider>
        </ConvexProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
