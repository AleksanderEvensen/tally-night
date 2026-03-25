import { Stack, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

export default function Profile() {
  const { userInfo, setUserInfo, dataConsent, convexUserId } = useApp();
  const router = useRouter();
  const updateUser = useMutation(api.users.updateUser);
  const [name, setName] = useState(userInfo?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(userInfo?.gender ?? 'male');
  const [weight, setWeight] = useState(String(userInfo?.weightInKg ?? ''));

  const canSave = name.trim().length >= 2 && Number(weight) > 0;

  async function handleSave() {
    if (!canSave) return;
    const trimmedName = name.trim();
    await setUserInfo({ name: trimmedName, gender, weightInKg: Number(weight) });

    // Sync name to backend if consented
    if (dataConsent && convexUserId) {
      try {
        await updateUser({ userId: convexUserId as Id<'users'>, name: trimmedName });
      } catch {
        // Non-critical — name sync failure doesn't block local save
      }
    }

    router.back();
  }

  return (
    <View className="flex flex-1 bg-background px-6">
      <Stack.Screen options={{ title: 'Profile' }} />

      <View className="pt-8">
        <Label className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Name
        </Label>
        <Input
          className="mb-8 h-auto text-lg ios:leading-0"
          placeholder="At least 2 characters"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <Label className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Gender
        </Label>
        <View className="flex-row gap-3 mb-8">
          <Pressable
            onPress={() => setGender('male')}
            className={cn(
              'flex-1 py-4 rounded-2xl items-center border-2',
              gender === 'male' ? 'border-indigo-500 bg-indigo-500/10' : 'border-border bg-card'
            )}>
            <Text className="text-2xl mb-1">♂</Text>
            <Text
              className={cn(
                'text-base font-semibold',
                gender === 'male' ? 'text-indigo-400' : 'text-muted-foreground'
              )}>
              Male
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGender('female')}
            className={cn(
              'flex-1 py-4 rounded-2xl items-center border-2',
              gender === 'female' ? 'border-indigo-500 bg-indigo-500/10' : 'border-border bg-card'
            )}>
            <Text className="text-2xl mb-1">♀</Text>
            <Text
              className={cn(
                'text-base font-semibold',
                gender === 'female' ? 'text-indigo-400' : 'text-muted-foreground'
              )}>
              Female
            </Text>
          </Pressable>
        </View>

        <Label className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Weight (kg)
        </Label>
        <Input
          className="h-auto text-lg ios:leading-0"
          placeholder="e.g. 75"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Button
          onPress={handleSave}
          disabled={!canSave}
          className={cn('mt-10 rounded-2xl py-4 h-auto', canSave ? 'bg-indigo-500' : 'bg-muted')}>
          <Text
            className={cn(
              'text-lg font-semibold',
              canSave ? 'text-white' : 'text-muted-foreground'
            )}>
            Save
          </Text>
        </Button>

        <Button
          variant="outline"
          onPress={() => router.push('/drink-presets')}
          className="mt-4 rounded-2xl py-4 h-auto border-2 border-border">
          <Text className="text-base font-semibold text-muted-foreground">Drink Presets</Text>
        </Button>

        <Button
          variant="outline"
          onPress={() => router.push('/privacy')}
          className="mt-4 rounded-2xl py-4 h-auto border-2 border-border">
          <Text className="text-base font-semibold text-muted-foreground">Data & Privacy</Text>
        </Button>
      </View>
    </View>
  );
}
