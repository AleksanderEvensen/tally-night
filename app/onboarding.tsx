import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Input } from '@/components/Input';
import { useApp } from '@/lib/context';

export default function Onboarding() {
  const { setUserInfo } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState('');

  const canContinue = name.trim().length >= 2 && gender !== null && Number(weight) > 0;

  async function handleContinue() {
    if (!gender || !canContinue) return;
    await setUserInfo({ name: name.trim(), gender, weightInKg: Number(weight) });
    router.replace('/');
  }

  return (
    <View className="flex flex-1 bg-white px-6">
      <Stack.Screen options={{ title: 'Setup', headerBackVisible: false }} />

      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome</Text>
        <Text className="text-base text-gray-500 mb-10">
          We need a few details to estimate your blood alcohol level. Everything stays on your
          device.
        </Text>

        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Name
        </Text>
        <Input
          className="mb-8"
          placeholder="At least 2 characters"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Gender
        </Text>
        <View className="flex-row gap-3 mb-8">
          <Pressable
            onPress={() => setGender('male')}
            className={`flex-1 py-4 rounded-2xl items-center border-2 ${
              gender === 'male' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
            }`}>
            <Text className="text-2xl mb-1">♂</Text>
            <Text
              className={`text-base font-semibold ${
                gender === 'male' ? 'text-indigo-600' : 'text-gray-600'
              }`}>
              Male
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGender('female')}
            className={`flex-1 py-4 rounded-2xl items-center border-2 ${
              gender === 'female' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
            }`}>
            <Text className="text-2xl mb-1">♀</Text>
            <Text
              className={`text-base font-semibold ${
                gender === 'female' ? 'text-indigo-600' : 'text-gray-600'
              }`}>
              Female
            </Text>
          </Pressable>
        </View>

        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Weight (kg)
        </Text>
        <Input
          placeholder="e.g. 75"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`mt-10 rounded-2xl py-4 items-center ${
            canContinue ? 'bg-indigo-500' : 'bg-gray-200'
          }`}>
          <Text className={`text-lg font-semibold ${canContinue ? 'text-white' : 'text-gray-400'}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
