import { Stack, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Input } from '@/components/Input';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

const EXPIRY_OPTIONS = [
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

export default function CreateGroup() {
  const { convexUserId } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ groupId: string; joinCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const createGroup = useMutation(api.groups.createGroup);

  const canCreate = name.trim().length >= 2 && !isCreating;

  async function handleCreate() {
    if (!canCreate || !convexUserId) return;
    setIsCreating(true);

    try {
      const res = await createGroup({
        name: name.trim(),
        userId: convexUserId as Id<'users'>,
        expiresInHours: expiryHours,
      });
      setResult({ groupId: res.groupId, joinCode: res.joinCode });
    } catch {
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await Clipboard.setStringAsync(result.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <View className="flex flex-1 bg-white px-6 items-center justify-center">
        <Stack.Screen options={{ title: 'Group Created' }} />
        <Text className="text-2xl font-bold text-gray-900 mb-2">Group Created!</Text>
        <Text className="text-base text-gray-500 mb-6 text-center">
          Share this code with your friends to join:
        </Text>
        <View className="bg-gray-50 rounded-2xl px-8 py-6 items-center border-2 border-gray-200 mb-4">
          <Text className="text-4xl font-bold text-indigo-600 tracking-[8px]">
            {result.joinCode}
          </Text>
        </View>
        <Pressable onPress={handleCopy} className="bg-indigo-500 rounded-2xl py-3 px-8 mb-6">
          <Text className="text-white text-base font-semibold">
            {copied ? 'Copied!' : 'Copy Code'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.replace({ pathname: '/leaderboard', params: { groupId: result.groupId } })
          }
          className="border-2 border-indigo-500 rounded-2xl py-3 px-8">
          <Text className="text-indigo-500 text-base font-semibold">View Leaderboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex flex-1 bg-white px-6">
      <Stack.Screen options={{ title: 'Create Group' }} />
      <View className="pt-8">
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Group Name
        </Text>
        <Input
          className="mb-8"
          placeholder="e.g. Friday Night"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus
        />

        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Expires After
        </Text>
        <View className="flex-row gap-2 mb-8">
          {EXPIRY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.hours}
              onPress={() => setExpiryHours(opt.hours)}
              className={`flex-1 py-3 rounded-xl items-center border-2 ${
                expiryHours === opt.hours
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  expiryHours === opt.hours ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleCreate}
          disabled={!canCreate}
          className={`rounded-2xl py-4 items-center ${
            canCreate ? 'bg-indigo-500' : 'bg-gray-200'
          }`}>
          <Text className={`text-lg font-semibold ${canCreate ? 'text-white' : 'text-gray-400'}`}>
            {isCreating ? 'Creating...' : 'Create Group'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
