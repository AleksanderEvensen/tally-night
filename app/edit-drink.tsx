import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
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
      <View className="flex flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ title: 'Edit Drink' }} />
        <Text className="text-muted-foreground">Drink not found.</Text>
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
    <View className="flex flex-1 bg-background">
      <Stack.Screen options={{ title: 'Edit Drink' }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}
        keyboardShouldPersistTaps="handled">
        {/* Time selector */}
        <View className="flex-row items-center justify-between mb-6 bg-muted rounded-xl p-3">
          <Text className="text-sm text-muted-foreground">Time</Text>
          <Button variant="outline" onPress={() => setShowTimePicker(true)} className="px-4 py-2">
            <Text className="text-base font-medium text-indigo-400">{formatTime(drinkTime)}</Text>
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

        <Label className="text-sm text-muted-foreground mb-2">Type</Label>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {DRINK_TYPES.map((t) => (
            <Button
              key={t}
              variant={type === t ? 'default' : 'outline'}
              onPress={() => setType(t)}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                type === t ? 'bg-indigo-500' : ''
              }`}>
              <Text className="text-base">{DRINK_TYPE_EMOJI[t]}</Text>
              <Text
                className={`text-sm font-medium ${
                  type === t ? 'text-white' : 'text-muted-foreground'
                }`}>
                {DRINK_TYPE_LABEL[t]}
              </Text>
            </Button>
          ))}
        </View>

        <Label className="text-sm text-muted-foreground mb-1">Volume (ml)</Label>
        <Input
          className="mb-3 h-auto text-lg ios:leading-0"
          placeholder="e.g. 330"
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />

        <Label className="text-sm text-muted-foreground mb-1">Alcohol %</Label>
        <Input
          className="mb-4 h-auto text-lg ios:leading-0"
          placeholder="e.g. 5"
          keyboardType="numeric"
          value={percent}
          onChangeText={setPercent}
        />

        <Button
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 h-auto ${canSave ? 'bg-indigo-500' : 'bg-muted'}`}>
          <Text
            className={`text-base font-semibold ${
              canSave ? 'text-white' : 'text-muted-foreground'
            }`}>
            Save Changes
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
}
