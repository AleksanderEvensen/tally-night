import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';
import { formatExpiry } from '@/lib/format';

function getBacColor(bac: number): string {
  if (bac === 0) return '#22c55e';
  if (bac < 0.3) return '#84cc16';
  if (bac < 0.5) return '#eab308';
  if (bac < 0.8) return '#f97316';
  return '#ef4444';
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return '\u{1F947}';
  if (rank === 2) return '\u{1F948}';
  if (rank === 3) return '\u{1F949}';
  return `#${rank}`;
}

export default function Session() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { convexUserId } = useApp();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

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

  async function handleLeave() {
    try {
      await leaveGroup({
        groupId: groupId as Id<'groups'>,
        userId: convexUserId as Id<'users'>,
      });
      router.back();
    } catch {
      // Mutation failure is visible via Convex's reactive queries
    }
    setLeaveDialogOpen(false);
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
          <Text variant="h3">{data.groupName}</Text>
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
                <Card
                  key={member.userId}
                  className={`flex-row items-center py-4 px-4 mb-2 ${
                    isMe ? 'bg-indigo-50 border-indigo-200' : ''
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
                        <Text className="text-xs text-gray-400">
                          {'\u{1F37A}'}
                          {member.drinks.beer}
                        </Text>
                      )}
                      {member.drinks.wine > 0 && (
                        <Text className="text-xs text-gray-400">
                          {'\u{1F377}'}
                          {member.drinks.wine}
                        </Text>
                      )}
                      {member.drinks.spirits > 0 && (
                        <Text className="text-xs text-gray-400">
                          {'\u{1F943}'}
                          {member.drinks.spirits}
                        </Text>
                      )}
                      {member.drinks.cocktails > 0 && (
                        <Text className="text-xs text-gray-400">
                          {'\u{1F378}'}
                          {member.drinks.cocktails}
                        </Text>
                      )}
                      {member.drinks.shots > 0 && (
                        <Text className="text-xs text-gray-400">
                          {'\u{1F943}'}
                          {member.drinks.shots}
                        </Text>
                      )}
                      {member.drinks.ciders_seltzers > 0 && (
                        <Text className="text-xs text-gray-400">
                          {'\u{1F34F}'}
                          {member.drinks.ciders_seltzers}
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
                    <Text className="text-xs text-gray-400">{'\u2030'}</Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        <Separator className="mx-6 mt-4" />

        {/* Disclaimer */}
        <View className="px-6 mt-4">
          <Text className="text-xs text-gray-400 text-center leading-4">
            Please drink responsibly. BAC values are estimates only and should never be used to
            determine fitness to drive or operate machinery.
          </Text>
        </View>

        {/* Leave button */}
        <View className="px-6 mt-6">
          <Button
            variant="outline"
            onPress={() => setLeaveDialogOpen(true)}
            className="border-2 border-red-200 rounded-2xl py-3">
            <Text className="text-red-500 text-base font-semibold">Leave Group</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Leave Group AlertDialog */}
      <AlertDialog
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) setLeaveDialogOpen(false);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setLeaveDialogOpen(false)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onPress={handleLeave}>
              <Text className="text-white">Leave</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
