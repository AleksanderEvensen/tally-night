import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DRINK_TYPE_EMOJI,
  DRINK_TYPE_LABEL,
  type Drink,
  type StomachStatus,
  type WaterEntry,
  estimateBAC,
} from '@/lib/bac';
import { useApp } from '@/lib/context';
import { formatTime } from '@/lib/format';

type HistoryEntry =
  | { kind: 'drink'; drink: Drink; originalIndex: number }
  | { kind: 'water'; water: WaterEntry; originalIndex: number };

const STOMACH_OPTIONS: { value: StomachStatus; label: string; icon: string }[] = [
  { value: 'empty', label: 'Empty', icon: '💨' },
  { value: 'moderate', label: 'Some food', icon: '🍞' },
  { value: 'full', label: 'Full', icon: '🍽️' },
];

const WATER_PRESETS = [200, 330, 500];

function getBacColor(bac: number): string {
  if (bac === 0) return '#22c55e';
  if (bac < 0.3) return '#84cc16';
  if (bac < 0.5) return '#eab308';
  if (bac < 0.8) return '#f97316';
  return '#ef4444';
}

function getBacStatus(bac: number): string {
  if (bac === 0) return 'Sober';
  if (bac < 0.3) return 'Minimal';
  if (bac < 0.5) return 'Light';
  if (bac < 0.8) return 'Moderate';
  return 'Elevated';
}

export default function Home() {
  const {
    userInfo,
    drinks,
    waterEntries,
    stomachStatus,
    setStomachStatus,
    addWater,
    deleteDrink,
    deleteWater,
    clearDrinks,
    isLoading,
  } = useApp();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Auto-clear history if the last drink was over 12 hours ago
  useEffect(() => {
    if (drinks.length === 0) return;
    const latestDrinkTime = Math.max(...drinks.map((d) => d.time.getTime()));
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    if (Date.now() - latestDrinkTime > twelveHoursMs) {
      clearDrinks();
    }
  }, [drinks, clearDrinks]);

  if (isLoading) {
    return (
      <View className="flex flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!userInfo) {
    return <Redirect href="/onboarding" />;
  }

  const bac = estimateBAC(drinks, userInfo, now, stomachStatus, waterEntries);
  const bacColor = getBacColor(bac);
  const bacStatus = getBacStatus(bac);

  // Merge drinks and water into a single timeline, newest first
  const history: HistoryEntry[] = [
    ...drinks.map((drink, i) => ({ kind: 'drink' as const, drink, originalIndex: i })),
    ...waterEntries.map((water, i) => ({ kind: 'water' as const, water, originalIndex: i })),
  ]
    .sort((a, b) => {
      const timeA = a.kind === 'drink' ? a.drink.time : a.water.time;
      const timeB = b.kind === 'drink' ? b.drink.time : b.water.time;
      return timeB.getTime() - timeA.getTime();
    })
    .slice(0, 30);

  function confirmDeleteDrink(index: number, drinkType: string) {
    Alert.alert('Delete Drink', `Are you sure you want to delete this ${drinkType}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDrink(index) },
    ]);
  }

  function confirmDeleteWater(index: number) {
    Alert.alert('Delete Water', 'Are you sure you want to delete this water entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWater(index) },
    ]);
  }

  function confirmClearHistory() {
    Alert.alert(
      'Clear History',
      'This will delete all your drinks and water entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearDrinks() },
      ]
    );
  }

  function logWater(ml: number) {
    addWater({ time: new Date(), volumeMl: ml });
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen
        options={{
          title: 'Tally Night',
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.push('/groups')} hitSlop={8}>
                <Ionicons name="people-outline" size={26} color="#6366f1" />
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
                <Ionicons name="person-circle-outline" size={28} color="#6366f1" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        <View className="items-center pt-8 pb-6">
          <Text className="text-base text-gray-500 mb-2">Blood Alcohol Level</Text>
          <Pressable onPress={() => router.push('/bac-graph')}>
            <Text style={{ color: bacColor }} className="text-7xl font-bold">
              {bac.toFixed(2)}
            </Text>
            <Text className="text-center text-sm text-gray-400 mt-1">‰ (tap for graph)</Text>
          </Pressable>
          <View
            style={{ backgroundColor: bacColor + '20' }}
            className="mt-3 px-4 py-1.5 rounded-full">
            <Text style={{ color: bacColor }} className="text-base font-semibold">
              {bacStatus}
            </Text>
          </View>
        </View>

        <View className="px-6 mb-4">
          <Text className="text-xs text-gray-400 mb-2 text-center uppercase tracking-wide">
            Stomach
          </Text>
          <View className="flex-row gap-2">
            {STOMACH_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setStomachStatus(opt.value)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  stomachStatus === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                }`}>
                <Text className="text-base">{opt.icon}</Text>
                <Text
                  className={`text-xs font-medium ${
                    stomachStatus === opt.value ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-6 mb-4">
          <Pressable
            onPress={() => router.push('/add-drink')}
            className="bg-indigo-500 rounded-2xl py-4 items-center shadow-sm">
            <Text className="text-white text-lg font-semibold">+ Add Drink</Text>
          </Pressable>
        </View>

        {/* Water quick-log */}
        <View className="px-6 mb-6">
          <Text className="text-xs text-gray-400 mb-2 text-center uppercase tracking-wide">
            Log Water
          </Text>
          <View className="flex-row gap-2">
            {WATER_PRESETS.map((ml) => (
              <Pressable
                key={ml}
                onPress={() => logWater(ml)}
                className="flex-1 py-3 rounded-xl items-center border border-blue-200 bg-blue-50 active:bg-blue-100">
                <Text className="text-base">💧</Text>
                <Text className="text-xs font-medium text-blue-600">{ml}ml</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-6 mb-4">
          <Text className="text-xs text-gray-400 text-center leading-4">
            BAC values are estimates only — not medical advice. Never drink and drive.
          </Text>
        </View>

        <View className="px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">History</Text>
            {history.length > 0 && (
              <Pressable
                onPress={confirmClearHistory}
                hitSlop={8}
                className="flex-row items-center gap-1">
                <Ionicons name="trash-outline" size={16} color="#9ca3af" />
                <Text className="text-sm text-gray-400">Clear</Text>
              </Pressable>
            )}
          </View>
          {history.length === 0 ? (
            <Text className="text-gray-400 text-center py-8">
              No entries yet.{'\n'}Tap {'"'}Add Drink{'"'} to get started.
            </Text>
          ) : (
            history.map((entry, i) => {
              if (entry.kind === 'drink') {
                const { drink, originalIndex } = entry;
                return (
                  <View
                    key={`d-${originalIndex}-${i}`}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-row items-center gap-3 flex-1">
                      <Text className="text-2xl">{DRINK_TYPE_EMOJI[drink.type] ?? '🍸'}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-gray-800">
                          {DRINK_TYPE_LABEL[drink.type] ?? drink.type}
                        </Text>
                        <Text className="text-sm text-gray-400">
                          {drink.volumeMl}ml · {drink.alcoholPercent}% · {formatTime(drink.time)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/edit-drink',
                            params: { index: originalIndex },
                          })
                        }
                        hitSlop={6}
                        className="p-2">
                        <Ionicons name="pencil-outline" size={18} color="#6366f1" />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDeleteDrink(originalIndex, drink.type)}
                        hitSlop={6}
                        className="p-2">
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                );
              }
              const { water, originalIndex } = entry;
              return (
                <View
                  key={`w-${originalIndex}-${i}`}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center gap-3 flex-1">
                    <Text className="text-2xl">💧</Text>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-blue-600">Water</Text>
                      <Text className="text-sm text-gray-400">
                        {water.volumeMl}ml · {formatTime(water.time)}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => confirmDeleteWater(originalIndex)}
                    hitSlop={6}
                    className="p-2">
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
