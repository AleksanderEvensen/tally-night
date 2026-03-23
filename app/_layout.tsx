import '../global.css';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { AppProvider } from '@/lib/context';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: '#fff' },
              contentStyle: { backgroundColor: '#fff' },
            }}
          />
        </KeyboardAvoidingView>
      </AppProvider>
    </SafeAreaProvider>
  );
}
