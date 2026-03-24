import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

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

export default function Groups() {
  const { dataConsent, convexUserId } = useApp();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  const groups = useQuery(
    api.groups.getMyGroups,
    dataConsent && convexUserId ? { userId: convexUserId as Id<'users'> } : 'skip'
  );

  const leaveGroup = useMutation(api.groups.leaveGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  if (!dataConsent) {
    return (
      <View className="flex flex-1 bg-white px-6 items-center justify-center">
        <Stack.Screen options={{ title: 'Groups' }} />
        <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
        <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
          Groups require data sharing
        </Text>
        <Text className="text-sm text-gray-400 mt-2 text-center leading-5">
          To use Groups, you need to consent to sharing your BAC and drink data. Your personal info
          (weight, gender, timestamps) is never shared.
        </Text>
        <Pressable
          onPress={() => router.push('/privacy')}
          className="mt-6 bg-indigo-500 rounded-2xl py-3 px-8">
          <Text className="text-white text-base font-semibold">Go to Data & Privacy</Text>
        </Pressable>
      </View>
    );
  }

  function confirmLeave(groupId: Id<'groups'>, groupName: string) {
    Alert.alert('Leave Group', `Are you sure you want to leave "${groupName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup({ groupId, userId: convexUserId as Id<'users'> });
          } catch {
            Alert.alert('Error', 'Could not leave group. Please try again.');
          }
        },
      },
    ]);
  }

  function confirmDelete(groupId: Id<'groups'>, groupName: string) {
    Alert.alert('Delete Group', `This will permanently delete "${groupName}" for all members.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup({ groupId, userId: convexUserId as Id<'users'> });
          } catch {
            Alert.alert('Error', 'Could not delete group. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Groups' }} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        {/* Action buttons */}
        <View className="flex-row gap-3 pt-6 mb-6">
          <Pressable
            onPress={() => router.push('/create-group')}
            className="flex-1 bg-indigo-500 rounded-2xl py-4 items-center">
            <Text className="text-white text-base font-semibold">Create Group</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/join-group')}
            className="flex-1 border-2 border-indigo-500 rounded-2xl py-4 items-center">
            <Text className="text-indigo-500 text-base font-semibold">Join Group</Text>
          </Pressable>
        </View>

        {/* Groups list */}
        {groups === undefined ? (
          <Text className="text-gray-400 text-center py-8">Loading...</Text>
        ) : groups.length === 0 ? (
          <Text className="text-gray-400 text-center py-8">
            No groups yet.{'\n'}Create one or join with a code!
          </Text>
        ) : (
          groups.map((group) => (
            <Pressable
              key={group.groupId}
              onPress={() =>
                router.push({ pathname: '/session', params: { groupId: group.groupId } })
              }
              className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200 active:bg-gray-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-lg font-semibold text-gray-900 flex-1">{group.name}</Text>
                <View className="flex-row gap-1">
                  {group.memberType === 'admin' && (
                    <Pressable
                      onPress={() => confirmDelete(group.groupId, group.name)}
                      hitSlop={6}
                      className="p-2">
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => confirmLeave(group.groupId, group.name)}
                    hitSlop={6}
                    className="p-2">
                    <Ionicons name="exit-outline" size={18} color="#6b7280" />
                  </Pressable>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-sm text-gray-400">Code: {group.joinCode}</Text>
                <Text className="text-sm text-gray-400">{formatExpiry(group.expires)}</Text>
              </View>
              {group.memberType === 'admin' && (
                <View className="bg-indigo-100 self-start px-2 py-0.5 rounded-full mt-2">
                  <Text className="text-xs font-medium text-indigo-600">Admin</Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
