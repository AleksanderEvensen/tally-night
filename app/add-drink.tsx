import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Drink } from '@/lib/bac';
import { useApp } from '@/lib/context';
import { DRINK_PRESETS } from '@/lib/drink-presets';
import { formatTime } from '@/lib/format';

export default function AddDrink() {
  const { addDrink } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [drinkTime, setDrinkTime] = useState(() => new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customVolume, setCustomVolume] = useState('');
  const [customPercent, setCustomPercent] = useState('');

  async function handleSelect(preset: (typeof DRINK_PRESETS)[number]) {
    const drink: Drink = {
      time: drinkTime,
      type: preset.type,
      volumeMl: preset.volumeMl,
      alcoholPercent: preset.alcoholPercent,
    };
    await addDrink(drink);
    router.back();
  }

  async function handleCustomSubmit() {
    const volume = Number(customVolume);
    const percent = Number(customPercent);
    if (volume <= 0 || percent <= 0 || percent > 100) return;

    const drink: Drink = {
      time: drinkTime,
      type: customName.trim() || 'custom',
      volumeMl: volume,
      alcoholPercent: percent,
    };
    await addDrink(drink);
    router.back();
  }

  const canSubmitCustom = Number(customVolume) > 0 && Number(customPercent) > 0;

  function handleTimeChange(_event: unknown, date?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setDrinkTime(date);
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Add a Drink' }} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}>
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

        {/* Presets */}
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Quick Pick
        </Text>
        <View className="flex-row flex-wrap gap-4 mb-6">
          {DRINK_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => handleSelect(preset)}
              className="w-[47%] border-2 border-gray-200 rounded-2xl p-4 items-center active:border-indigo-400 active:bg-indigo-50">
              <Text className="text-4xl mb-2">{preset.emoji}</Text>
              <Text className="text-base font-semibold text-gray-800 text-center">
                {preset.name}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                {preset.volumeMl}ml · {preset.alcoholPercent}%
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Custom drink */}
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Custom Drink
        </Text>
        {!showCustom ? (
          <Pressable
            onPress={() => setShowCustom(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl py-6 items-center">
            <Text className="text-2xl mb-1">🍹</Text>
            <Text className="text-base text-gray-500">Tap to enter a custom drink</Text>
          </Pressable>
        ) : (
          <View className="border-2 border-gray-200 rounded-2xl p-4">
            <Text className="text-sm text-gray-500 mb-1">Name (optional)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-3"
              placeholder="e.g. Margarita"
              placeholderTextColor="#9ca3af"
              value={customName}
              onChangeText={setCustomName}
            />

            <Text className="text-sm text-gray-500 mb-1">Volume (ml)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-3"
              placeholder="e.g. 330"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={customVolume}
              onChangeText={setCustomVolume}
            />

            <Text className="text-sm text-gray-500 mb-1">Alcohol %</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 mb-4"
              placeholder="e.g. 5"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={customPercent}
              onChangeText={setCustomPercent}
            />

            <Pressable
              onPress={handleCustomSubmit}
              disabled={!canSubmitCustom}
              className={`rounded-xl py-3 items-center ${
                canSubmitCustom ? 'bg-indigo-500' : 'bg-gray-200'
              }`}>
              <Text
                className={`text-base font-semibold ${
                  canSubmitCustom ? 'text-white' : 'text-gray-400'
                }`}>
                Add Drink
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
