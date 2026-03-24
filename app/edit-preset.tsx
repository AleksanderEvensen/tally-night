import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/input';
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
        <Text className="text-gray-400">Preset not found.</Text>
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
        {/* Emoji picker */}
        <Text className="text-sm text-gray-500 mb-2">Emoji</Text>
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

        {/* Name */}
        <Text className="text-sm text-gray-500 mb-1">Name</Text>
        <Input
          size="compact"
          className="mb-3"
          placeholder="e.g. IPA Pint"
          value={name}
          onChangeText={setName}
        />

        {/* Type */}
        <Text className="text-sm text-gray-500 mb-2">Type</Text>
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
                  type === t ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                {DRINK_TYPE_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Volume */}
        <Text className="text-sm text-gray-500 mb-1">Volume (ml)</Text>
        <Input
          size="compact"
          className="mb-3"
          placeholder="e.g. 330"
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />

        {/* Alcohol % */}
        <Text className="text-sm text-gray-500 mb-1">Alcohol %</Text>
        <Input
          size="compact"
          className="mb-6"
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
            {isEditing ? 'Save Changes' : 'Add Preset'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
