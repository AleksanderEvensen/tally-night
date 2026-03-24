import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

function getBacColor(bac: number): string {
  if (bac === 0) return '#22c55e';
  if (bac < 0.3) return '#84cc16';
  if (bac < 0.5) return '#eab308';
  if (bac < 0.8) return '#f97316';
  return '#ef4444';
}

function formatExpiry(expires: number): string {
  const now = Date.now();
  const diff = expires - now;
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function Session() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { convexUserId } = useApp();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const data = useQuery(
    api.groups.getLeaderboard,
    groupId ? { groupId: groupId as Id<'groups'> } : 'skip'
  );

  const leaveGroup = useMutation(api.groups.leaveGroup);

  async function handleCopyCode() {
    if (!data) return;
    await Clipboard.setStringAsync(data.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function confirmLeave() {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup({
              groupId: groupId as Id<'groups'>,
              userId: convexUserId as Id<'users'>,
            });
            router.back();
          } catch {
            Alert.alert('Error', 'Could not leave group.');
          }
        },
      },
    ]);
  }

  if (!data) {
    return (
      <View className="flex flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: 'Session' }} />
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: data.groupName }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        {/* Group info header */}
        <View className="px-6 pt-6 pb-4 items-center">
          <Text className="text-2xl font-bold text-gray-900">{data.groupName}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <Pressable
              onPress={handleCopyCode}
              className="flex-row items-center gap-1.5 bg-gray-100 rounded-full px-4 py-1.5">
              <Text className="text-sm font-semibold text-gray-600">{data.joinCode}</Text>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? '#22c55e' : '#6b7280'}
              />
            </Pressable>
            <View className="bg-gray-100 rounded-full px-3 py-1.5">
              <Text className="text-sm text-gray-500">{formatExpiry(data.expires)}</Text>
            </View>
          </View>
        </View>

        {/* Members */}
        <View className="px-6">
          {data.leaderboard.length === 0 ? (
            <Text className="text-gray-400 text-center py-8">No members yet</Text>
          ) : (
            data.leaderboard.map((member, index) => {
              const rank = index + 1;
              const isMe = member.userId === convexUserId;
              return (
                <View
                  key={member.userId}
                  className={`flex-row items-center py-4 border-b border-gray-100 ${
                    isMe ? 'bg-indigo-50 -mx-3 px-3 rounded-xl border-0' : ''
                  }`}>
                  {/* Rank */}
                  <View className="w-10 items-center">
                    <Text className={`text-lg ${rank <= 3 ? '' : 'font-semibold text-gray-400'}`}>
                      {getRankEmoji(rank)}
                    </Text>
                  </View>

                  {/* Name & drinks */}
                  <View className="flex-1 ml-2">
                    <Text
                      className={`text-base font-semibold ${isMe ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {member.name}
                      {isMe ? ' (you)' : ''}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      {member.drinks.beer > 0 && (
                        <Text className="text-xs text-gray-400">🍺{member.drinks.beer}</Text>
                      )}
                      {member.drinks.wine > 0 && (
                        <Text className="text-xs text-gray-400">🍷{member.drinks.wine}</Text>
                      )}
                      {member.drinks.spirits > 0 && (
                        <Text className="text-xs text-gray-400">🥃{member.drinks.spirits}</Text>
                      )}
                      {member.drinks.cocktails > 0 && (
                        <Text className="text-xs text-gray-400">🍸{member.drinks.cocktails}</Text>
                      )}
                      {member.drinks.shots > 0 && (
                        <Text className="text-xs text-gray-400">🥃{member.drinks.shots}</Text>
                      )}
                      {member.drinks.ciders_seltzers > 0 && (
                        <Text className="text-xs text-gray-400">
                          🍏{member.drinks.ciders_seltzers}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* BAC */}
                  <View className="items-end">
                    <Text
                      style={{ color: getBacColor(member.bloodAlcoholLevel) }}
                      className="text-2xl font-bold">
                      {member.bloodAlcoholLevel.toFixed(2)}
                    </Text>
                    <Text className="text-xs text-gray-400">‰</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Disclaimer */}
        <View className="px-6 mt-6">
          <Text className="text-xs text-gray-400 text-center leading-4">
            Please drink responsibly. BAC values are estimates only and should never be used to
            determine fitness to drive or operate machinery.
          </Text>
        </View>

        {/* Leave button */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={confirmLeave}
            className="border-2 border-red-200 rounded-2xl py-3 items-center">
            <Text className="text-red-500 text-base font-semibold">Leave Group</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
