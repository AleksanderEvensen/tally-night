import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { DRINK_TYPE_EMOJI, DRINK_TYPE_LABEL, DRINK_TYPES } from '@/lib/bac';
import { useApp } from '@/lib/context';
import type { DrinkPreset } from '@/lib/drink-presets';

const EMOJI_OPTIONS = [...new Set([...Object.values(DRINK_TYPE_EMOJI), '🥂', '🍹', '🍶', '🧉'])];

export default function EditPreset() {
  const { drinkPresets, setDrinkPresets } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();

  const isEditing = indexParam !== undefined;
  const index = isEditing ? Number(indexParam) : -1;
  const existing = isEditing ? drinkPresets[index] : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🍺');
  const [type, setType] = useState(existing?.type ?? 'beer');
  const [volume, setVolume] = useState(existing ? String(existing.volumeMl) : '');
  const [percent, setPercent] = useState(existing ? String(existing.alcoholPercent) : '');

  const canSave =
    name.trim().length > 0 && Number(volume) > 0 && Number(percent) > 0 && Number(percent) <= 100;

  async function handleSave() {
    if (!canSave) return;

    const preset: DrinkPreset = {
      id: existing?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      emoji,
      type,
      volumeMl: Number(volume),
      alcoholPercent: Number(percent),
    };

    const updated = [...drinkPresets];
    if (isEditing) {
      updated[index] = preset;
    } else {
      updated.push(preset);
    }

    await setDrinkPresets(updated);
    router.back();
  }

  if (isEditing && !existing) {
    return (
      <View className="flex flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: 'Edit Preset' }} />
        <Text className="text-muted-foreground">Preset not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: isEditing ? 'Edit Preset' : 'New Preset' }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}
        keyboardShouldPersistTaps="handled">
        <Label className="mb-2">Emoji</Label>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {EMOJI_OPTIONS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              className={`w-12 h-12 items-center justify-center rounded-xl border-2 ${
                emoji === e ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}>
              <Text className="text-2xl">{e}</Text>
            </Pressable>
          ))}
        </View>

        <Label className="mb-1">Name</Label>
        <Input className="mb-3" placeholder="e.g. IPA Pint" value={name} onChangeText={setName} />

        <Label className="mb-2">Type</Label>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {DRINK_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`px-4 py-2 rounded-xl border-2 ${
                type === t ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  type === t ? 'text-indigo-600' : 'text-muted-foreground'
                }`}>
                {DRINK_TYPE_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Label className="mb-1">Volume (ml)</Label>
        <Input
          className="mb-3"
          placeholder="e.g. 330"
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />

        <Label className="mb-1">Alcohol %</Label>
        <Input
          className="mb-6"
          placeholder="e.g. 5"
          keyboardType="numeric"
          value={percent}
          onChangeText={setPercent}
        />

        <Button onPress={handleSave} disabled={!canSave} className="rounded-xl py-4 h-auto">
          <Text className="text-base font-semibold">
            {isEditing ? 'Save Changes' : 'Add Preset'}
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
}
