import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context';

export default function Onboarding() {
  const { setUserInfo } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const canContinue =
    name.trim().length >= 2 && gender !== null && Number(weight) > 0 && ageConfirmed;

  async function handleContinue() {
    if (!gender || !canContinue) return;
    await setUserInfo({ name: name.trim(), gender, weightInKg: Number(weight) });
    router.replace('/');
  }

  return (
    <View className="flex flex-1 bg-background">
      <Stack.Screen options={{ title: 'Setup', headerBackVisible: false }} />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <View className="pt-12">
          <Text className="text-3xl font-bold mb-2">Welcome</Text>
          <Text className="text-base text-muted-foreground mb-10">
            We need a few details to estimate your blood alcohol level. Everything stays on your
            device.
          </Text>

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

          {/* Age confirmation & disclaimer */}
          <View className="mt-8 bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
            <Pressable
              onPress={() => setAgeConfirmed(!ageConfirmed)}
              className="flex-row items-start gap-3">
              <Checkbox
                checked={ageConfirmed}
                onCheckedChange={(val) => setAgeConfirmed(val === true)}
                className="mt-0.5"
              />
              <Text className="flex-1 text-sm leading-5">
                I confirm that I am of legal drinking age in my country
              </Text>
            </Pressable>

            <View className="mt-3 pt-3 border-t border-amber-500/30">
              <Text className="text-xs text-amber-600 dark:text-amber-400 leading-4">
                This app is meant as a fun tool between friends and does not provide health or
                medical advice. BAC estimates are approximate and should never be used to determine
                fitness to drive or operate machinery. Always drink responsibly.
              </Text>
            </View>
          </View>

          <Button
            onPress={handleContinue}
            disabled={!canContinue}
            className={cn(
              'mt-6 rounded-2xl py-4 h-auto',
              canContinue ? 'bg-indigo-500' : 'bg-muted'
            )}>
            <Text
              className={cn(
                'text-lg font-semibold',
                canContinue ? 'text-white' : 'text-muted-foreground'
              )}>
              Continue
            </Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
