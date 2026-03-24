import '../global.css';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { AppProvider } from '@/lib/context';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AppProvider>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: '#fff' },
              contentStyle: { backgroundColor: '#fff' },
            }}
          />
        </AppProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
