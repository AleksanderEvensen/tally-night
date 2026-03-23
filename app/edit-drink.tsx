import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useApp } from '@/lib/context';
import { formatTime } from '@/lib/format';

export default function EditDrink() {
  const { drinks, updateDrink } = useApp();
  const router = useRouter();
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const index = Number(indexParam);
  const drink = drinks[index];

  const [drinkTime, setDrinkTime] = useState(() => (drink ? new Date(drink.time) : new Date()));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [name, setName] = useState(drink?.type ?? '');
  const [volume, setVolume] = useState(String(drink?.volumeMl ?? ''));
  const [percent, setPercent] = useState(String(drink?.alcoholPercent ?? ''));

  if (!drink) {
    return (
      <View className="flex flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: 'Edit Drink' }} />
        <Text className="text-gray-400">Drink not found.</Text>
      </View>
    );
  }

  const canSave = Number(volume) > 0 && Number(percent) > 0 && Number(percent) <= 100;

  async function handleSave() {
    if (!canSave) return;
    await updateDrink(index, {
      time: drinkTime,
      type: name.trim() || 'custom',
      volumeMl: Number(volume),
      alcoholPercent: Number(percent),
    });
    router.back();
  }

  function handleTimeChange(_event: unknown, date?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setDrinkTime(date);
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Edit Drink' }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 pb-12"
        keyboardShouldPersistTaps="handled">
        {/* Time selector */}
        <View className="flex-row items-center justify-between mb-6 bg-gray-50 rounded-xl p-3">
          <Text className="text-sm text-gray-500">Time</Text>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2">
            <Text className="text-base font-medium text-indigo-600">{formatTime(drinkTime)}</Text>
          </Pressable>
        </View>

        {showTimePicker && (
          <View className="mb-4">
            <DateTimePicker
              value={drinkTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              maximumDate={new Date()}
            />
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowTimePicker(false)}
                className="self-center mt-2 px-6 py-2 bg-indigo-500 rounded-lg">
                <Text className="text-white font-medium">Done</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text className="text-sm text-gray-500 mb-1">Name</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-3"
          placeholder="e.g. Beer"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-sm text-gray-500 mb-1">Volume (ml)</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-3"
          placeholder="e.g. 330"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />

        <Text className="text-sm text-gray-500 mb-1">Alcohol %</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-4"
          placeholder="e.g. 5"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={percent}
          onChangeText={setPercent}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center ${canSave ? 'bg-indigo-500' : 'bg-gray-200'}`}>
          <Text className={`text-base font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            Save Changes
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
