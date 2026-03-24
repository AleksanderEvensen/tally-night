import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/input';
import { DRINK_TYPE_EMOJI, DRINK_TYPE_LABEL, DRINK_TYPES, type DrinkType } from '@/lib/bac';
import { useApp } from '@/lib/context';
import { formatTime } from '@/lib/format';

export default function EditDrink() {
  const { drinks, updateDrink } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const index = Number(indexParam);
  const drink = drinks[index];

  const [drinkTime, setDrinkTime] = useState(() => (drink ? new Date(drink.time) : new Date()));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [type, setType] = useState<DrinkType>(drink?.type ?? 'beer');
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
      type,
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
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}
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

        <Text className="text-sm text-gray-500 mb-2">Type</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {DRINK_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-2 ${
                type === t ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}>
              <Text className="text-base">{DRINK_TYPE_EMOJI[t]}</Text>
              <Text
                className={`text-sm font-medium ${
                  type === t ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                {DRINK_TYPE_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm text-gray-500 mb-1">Volume (ml)</Text>
        <Input
          size="compact"
          className="mb-3"
          placeholder="e.g. 330"
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />

        <Text className="text-sm text-gray-500 mb-1">Alcohol %</Text>
        <Input
          size="compact"
          className="mb-4"
          placeholder="e.g. 5"
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
