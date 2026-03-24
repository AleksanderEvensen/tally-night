import { Stack } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

export default function Privacy() {
  const { dataConsent, setDataConsent, convexUserId, setConvexUserId, userInfo } = useApp();
  const { bottom } = useSafeAreaInsets();
  const [isToggling, setIsToggling] = useState(false);

  const registerUser = useMutation(api.users.registerUser);
  const registerLogin = useMutation(api.users.registerLogin);
  const deleteUserData = useMutation(api.users.deleteUserData);

  async function handleToggleConsent(newValue: boolean) {
    if (isToggling) return;
    setIsToggling(true);

    try {
      if (newValue) {
        // Enabling consent
        if (convexUserId) {
          // Already registered — just update lastSeen
          try {
            await registerLogin({ userId: convexUserId as Id<'users'> });
          } catch {
            // Non-critical — user might have been cleaned up, re-register
            const name = userInfo?.name ?? 'Anonymous';
            const userId = await registerUser({ name });
            setConvexUserId(userId);
          }
        } else {
          // First time — register
          const name = userInfo?.name ?? 'Anonymous';
          const userId = await registerUser({ name });
          setConvexUserId(userId);
        }
        setDataConsent(true);
      } else {
        // Disabling consent — confirm with user first
        setIsToggling(false);
        Alert.alert(
          'Disable Data Sharing?',
          'This will remove you from all groups and delete your data from our server. Your local data (drinks, BAC history) will not be affected.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable & Delete',
              style: 'destructive',
              onPress: async () => {
                setIsToggling(true);
                try {
                  if (convexUserId) {
                    await deleteUserData({
                      userId: convexUserId as Id<'users'>,
                    });
                  }
                  setDataConsent(false);
                } catch {
                  Alert.alert(
                    'Error',
                    'Could not delete your data from the server. Please try again.'
                  );
                } finally {
                  setIsToggling(false);
                }
              },
            },
          ]
        );
        return;
      }
    } catch {
      Alert.alert('Error', 'Could not connect to the server. Please try again later.');
      // Don't change consent state on failure
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Data & Privacy' }} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        <View className="pt-8 pb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Data Sharing</Text>
          <Text className="text-base text-gray-500 leading-6">
            The Groups feature lets you create or join groups with friends and see a live session
            view. To use it, you need to consent to sharing some data with our server.
          </Text>
        </View>

        {/* What's shared */}
        <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
          <Text className="text-sm font-bold text-green-800 mb-2 uppercase tracking-wide">
            Shared with groups
          </Text>
          <View className="gap-1.5">
            <Text className="text-sm text-green-700">- Your display name</Text>
            <Text className="text-sm text-green-700">
              - Your current BAC (Blood Alcohol Content) level
            </Text>
            <Text className="text-sm text-green-700">
              - Drink counts by category (beer, wine, shots, cocktails)
            </Text>
          </View>
        </View>

        {/* What's never shared */}
        <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
          <Text className="text-sm font-bold text-red-800 mb-2 uppercase tracking-wide">
            Never shared
          </Text>
          <View className="gap-1.5">
            <Text className="text-sm text-red-700">- Gender</Text>
            <Text className="text-sm text-red-700">- Weight</Text>
            <Text className="text-sm text-red-700">- When you drank (timestamps)</Text>
            <Text className="text-sm text-red-700">- Drink volumes & ABV%</Text>
            <Text className="text-sm text-red-700">- Stomach status</Text>
            <Text className="text-sm text-red-700">- Water intake</Text>
          </View>
        </View>

        {/* Explanation */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Why is this safe?</Text>
          <Text className="text-sm text-gray-500 leading-5">
            BAC (Blood Alcohol Content) is a single number representing how much alcohol is in your
            system. Without knowing when you drank, your body weight, or stomach contents, no one
            can reverse-engineer your personal details from a BAC number and drink counts alone.
          </Text>
        </View>

        {/* Consent toggle */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 border-2 border-gray-200 mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-gray-900">Share data with groups</Text>
            <Text className="text-sm text-gray-400 mt-0.5">
              {dataConsent ? 'Groups feature is enabled' : 'Required to use Groups'}
            </Text>
          </View>
          <Switch
            value={dataConsent}
            onValueChange={handleToggleConsent}
            disabled={isToggling}
            trackColor={{ false: '#d1d5db', true: '#818cf8' }}
            thumbColor={dataConsent ? '#6366f1' : '#f4f4f5'}
          />
        </View>

        {dataConsent && convexUserId && (
          <Text className="text-xs text-gray-300 text-center mb-6">Registered with server</Text>
        )}

        {/* Privacy Policy link */}
        <View className="mt-6 pt-6 border-t border-gray-200">
          <Pressable
            onPress={() => Linking.openURL('https://ahse.no/tally-night/privacy-policy')}
            className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <View>
              <Text className="text-base font-semibold text-gray-900">Privacy Policy</Text>
              <Text className="text-sm text-gray-400 mt-0.5">View full privacy policy</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
