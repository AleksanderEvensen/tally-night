import { Stack, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Input } from '@/components/Input';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

export default function JoinGroup() {
  const { convexUserId } = useApp();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const joinGroup = useMutation(api.groups.joinGroup);

  const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const canJoin = cleanCode.length === 6 && !isJoining;

  async function handleJoin() {
    if (!canJoin || !convexUserId) return;
    setIsJoining(true);

    try {
      const res = await joinGroup({
        joinCode: cleanCode,
        userId: convexUserId as Id<'users'>,
      });
      router.replace({ pathname: '/session', params: { groupId: res.groupId } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not join group. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <View className="flex flex-1 bg-white px-6">
      <Stack.Screen options={{ title: 'Join Group' }} />
      <View className="pt-8 items-center">
        <Text className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Enter Join Code
        </Text>
        <Input
          className="mb-8 w-full"
          placeholder="ABC123"
          placeholderTextColor="#d1d5db"
          value={cleanCode}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
          style={{
            height: 64,
            fontSize: 28,
            textAlign: 'center',
            letterSpacing: 6,
            fontWeight: 'bold',
          }}
        />

        <Text className="text-sm text-gray-400 mb-8 text-center">
          Ask the group creator for the 6-character code
        </Text>

        <Pressable
          onPress={handleJoin}
          disabled={!canJoin}
          className={`rounded-2xl py-4 items-center w-full ${
            canJoin ? 'bg-indigo-500' : 'bg-gray-200'
          }`}>
          <Text className={`text-lg font-semibold ${canJoin ? 'text-white' : 'text-gray-400'}`}>
            {isJoining ? 'Joining...' : 'Join Group'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
