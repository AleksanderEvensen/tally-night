import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/lib/context';
import { DEFAULT_DRINK_PRESETS } from '@/lib/drink-presets';

export default function DrinkPresets() {
  const { drinkPresets, setDrinkPresets } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  function handleDelete(index: number) {
    const preset = drinkPresets[index];
    Alert.alert('Delete Preset', `Remove "${preset.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = drinkPresets.filter((_, i) => i !== index);
          setDrinkPresets(updated);
        },
      },
    ]);
  }

  function handleResetDefaults() {
    Alert.alert(
      'Reset to Defaults',
      'This will replace all your presets with the original defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setDrinkPresets(DEFAULT_DRINK_PRESETS),
        },
      ]
    );
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Drink Presets' }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}>
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Your Presets
        </Text>

        {drinkPresets.length === 0 && (
          <View className="border-2 border-dashed border-gray-300 rounded-2xl py-8 items-center mb-4">
            <Text className="text-gray-400 text-base">No presets yet</Text>
          </View>
        )}

        {drinkPresets.map((preset, index) => (
          <View
            key={preset.id}
            className="flex-row items-center border-2 border-gray-200 rounded-2xl p-4 mb-3">
            <Text className="text-3xl mr-3">{preset.emoji}</Text>
            <Pressable
              className="flex-1"
              onPress={() => router.push(`/edit-preset?index=${index}`)}>
              <Text className="text-base font-semibold text-gray-800">{preset.name}</Text>
              <Text className="text-sm text-gray-400">
                {preset.volumeMl}ml · {preset.alcoholPercent}%
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(index)}
              className="ml-2 w-10 h-10 items-center justify-center rounded-xl bg-gray-100 active:bg-red-100">
              <Text className="text-lg text-gray-400">✕</Text>
            </Pressable>
          </View>
        ))}

        {/* Add new preset */}
        <Pressable
          onPress={() => router.push('/edit-preset')}
          className="border-2 border-dashed border-gray-300 rounded-2xl py-5 items-center mb-6 active:border-indigo-400 active:bg-indigo-50">
          <Text className="text-2xl mb-1">+</Text>
          <Text className="text-base text-gray-500">Add New Preset</Text>
        </Pressable>

        {/* Reset to defaults */}
        <Pressable
          onPress={handleResetDefaults}
          className="rounded-2xl py-4 items-center border-2 border-gray-200 active:bg-gray-50">
          <Text className="text-base font-semibold text-gray-600">Reset to Defaults</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
