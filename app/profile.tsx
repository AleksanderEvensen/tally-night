import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useApp } from '@/lib/context';

export default function Profile() {
  const { userInfo, setUserInfo } = useApp();
  const router = useRouter();
  const [name, setName] = useState(userInfo?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(userInfo?.gender ?? 'male');
  const [weight, setWeight] = useState(String(userInfo?.weightInKg ?? ''));

  const canSave = name.trim().length >= 2 && Number(weight) > 0;

  async function handleSave() {
    if (!canSave) return;
    await setUserInfo({ name: name.trim(), gender, weightInKg: Number(weight) });
    router.back();
  }

  return (
    <View className="flex flex-1 bg-white px-6">
      <Stack.Screen options={{ title: 'Profile' }} />

      <View className="pt-8">
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Name
        </Text>
        <TextInput
          className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg text-gray-900 mb-8"
          placeholder="At least 2 characters"
          placeholderTextColor="#9ca3af"
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
        <TextInput
          className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg text-gray-900"
          placeholder="e.g. 75"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`mt-10 rounded-2xl py-4 items-center ${
            canSave ? 'bg-indigo-500' : 'bg-gray-200'
          }`}>
          <Text className={`text-lg font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
