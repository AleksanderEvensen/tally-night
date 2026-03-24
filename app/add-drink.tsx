import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import {
  DRINK_TYPE_EMOJI,
  DRINK_TYPE_LABEL,
  DRINK_TYPES,
  type Drink,
  type DrinkType,
} from '@/lib/bac';
import { useApp } from '@/lib/context';
import { formatTime } from '@/lib/format';

export default function AddDrink() {
  const { addDrink, drinkPresets } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [drinkTime, setDrinkTime] = useState(() => new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customType, setCustomType] = useState<DrinkType>('beer');
  const [customVolume, setCustomVolume] = useState('');
  const [customPercent, setCustomPercent] = useState('');

  async function handleSelect(preset: (typeof drinkPresets)[number]) {
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
      type: customType,
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
          <Button variant="outline" onPress={() => setShowTimePicker(true)} className="px-4 py-2">
            <Text className="text-base font-medium text-indigo-600">{formatTime(drinkTime)}</Text>
          </Button>
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
              <Button
                onPress={() => setShowTimePicker(false)}
                className="self-center mt-2 px-6 py-2 bg-indigo-500 rounded-lg">
                <Text className="text-white font-medium">Done</Text>
              </Button>
            )}
          </View>
        )}

        {/* Presets */}
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Quick Pick
        </Text>
        <View className="flex-row flex-wrap gap-4 mb-6">
          {drinkPresets.map((preset) => (
            <Pressable key={preset.id} onPress={() => handleSelect(preset)} className="w-[47%]">
              <Card className="p-4 items-center active:border-indigo-400 active:bg-indigo-50">
                <Text className="text-4xl mb-2">{preset.emoji}</Text>
                <Text className="text-base font-semibold text-gray-800 text-center">
                  {preset.name}
                </Text>
                <Text variant="muted" className="mt-1">
                  {preset.volumeMl}ml · {preset.alcoholPercent}%
                </Text>
              </Card>
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
          <Card className="p-4">
            <Label className="text-sm text-gray-500 mb-2">Type</Label>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {DRINK_TYPES.map((t) => (
                <Button
                  key={t}
                  variant={customType === t ? 'default' : 'outline'}
                  onPress={() => setCustomType(t)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                    customType === t ? 'bg-indigo-500' : ''
                  }`}>
                  <Text className="text-base">{DRINK_TYPE_EMOJI[t]}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      customType === t ? 'text-white' : 'text-gray-600'
                    }`}>
                    {DRINK_TYPE_LABEL[t]}
                  </Text>
                </Button>
              ))}
            </View>

            <Label className="text-sm text-gray-500 mb-1">Volume (ml)</Label>
            <Input
              className="mb-3 h-9"
              placeholder="e.g. 330"
              keyboardType="numeric"
              value={customVolume}
              onChangeText={setCustomVolume}
            />

            <Label className="text-sm text-gray-500 mb-1">Alcohol %</Label>
            <Input
              className="mb-4 h-9"
              placeholder="e.g. 5"
              keyboardType="numeric"
              value={customPercent}
              onChangeText={setCustomPercent}
            />

            <Button
              onPress={handleCustomSubmit}
              disabled={!canSubmitCustom}
              className={`rounded-xl py-3 ${canSubmitCustom ? 'bg-indigo-500' : 'bg-gray-200'}`}>
              <Text
                className={`text-base font-semibold ${
                  canSubmitCustom ? 'text-white' : 'text-gray-400'
                }`}>
                Add Drink
              </Text>
            </Button>
          </Card>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
