import { Stack } from 'expo-router';
import { useMutation } from 'convex/react';
import { Shield } from 'lucide-react-native';
import { useState } from 'react';
import { Alert as RNAlert, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
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
        RNAlert.alert(
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
                  RNAlert.alert(
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
      RNAlert.alert('Error', 'Could not connect to the server. Please try again later.');
      // Don't change consent state on failure
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <View className="flex flex-1 bg-background">
      <Stack.Screen options={{ title: 'Data & Privacy' }} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        <View className="pt-8 pb-4">
          <Text variant="h3" className="mb-2">
            Data Sharing
          </Text>
          <Text variant="muted" className="text-base leading-6">
            The Groups feature lets you create or join groups with friends and see a live session
            view. To use it, you need to consent to sharing some data with our server.
          </Text>
        </View>

        {/* What's shared */}
        <Card className="mb-4 border-green-500/30 bg-green-500/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-green-600 dark:text-green-400">
              Shared with groups
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-1.5">
            <Text className="text-sm text-green-700 dark:text-green-300">- Your display name</Text>
            <Text className="text-sm text-green-700 dark:text-green-300">
              - Your current BAC (Blood Alcohol Content) level
            </Text>
            <Text className="text-sm text-green-700 dark:text-green-300">
              - Drink counts by category (beer, wine, shots, cocktails)
            </Text>
          </CardContent>
        </Card>

        {/* What's never shared */}
        <Card className="mb-4 border-red-500/30 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-red-600 dark:text-red-400">
              Never shared
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-1.5">
            <Text className="text-sm text-red-700 dark:text-red-300">- Gender</Text>
            <Text className="text-sm text-red-700 dark:text-red-300">- Weight</Text>
            <Text className="text-sm text-red-700 dark:text-red-300">
              - When you drank (timestamps)
            </Text>
            <Text className="text-sm text-red-700 dark:text-red-300">- Drink volumes & ABV%</Text>
            <Text className="text-sm text-red-700 dark:text-red-300">- Stomach status</Text>
            <Text className="text-sm text-red-700 dark:text-red-300">- Water intake</Text>
          </CardContent>
        </Card>

        {/* Consent toggle */}
        <Card className="mb-4 flex-row items-center justify-between p-4">
          <View className="mr-4 flex-1">
            <Text className="text-base font-semibold">Share data with groups</Text>
            <Text variant="muted" className="mt-0.5">
              {dataConsent ? 'Groups feature is enabled' : 'Required to use Groups'}
            </Text>
          </View>
          <Switch
            checked={dataConsent}
            onCheckedChange={handleToggleConsent}
            disabled={isToggling}
          />
        </Card>

        {dataConsent && convexUserId && (
          <Text variant="muted" className="mb-6 text-center text-xs">
            Registered with server
          </Text>
        )}

        {/* Privacy Policy link */}
        <View className="mt-6 border-t border-border pt-6">
          <Button
            variant="outline"
            className="flex-row h-auto items-center justify-between rounded-2xl p-4"
            onPress={() =>
              Linking.openURL('https://aleksanderevensen.github.io/tally-night/privacy-policy.html')
            }>
            <View>
              <Text className="text-base font-semibold">Privacy Policy</Text>
              <Text variant="muted" className="mt-0.5">
                View full privacy policy
              </Text>
            </View>
            <Text className="text-lg text-muted-foreground">›</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
