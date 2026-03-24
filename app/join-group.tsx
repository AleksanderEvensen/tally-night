import { Stack, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useApp } from '@/lib/context';

export default function JoinGroup() {
  const { convexUserId } = useApp();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGroup = useMutation(api.groups.joinGroup);

  const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const canJoin = cleanCode.length === 6 && !isJoining;

  async function handleJoin() {
    if (!canJoin || !convexUserId) return;
    setIsJoining(true);
    setError(null);

    try {
      const res = await joinGroup({
        joinCode: cleanCode,
        userId: convexUserId as Id<'users'>,
      });
      router.replace({ pathname: '/session', params: { groupId: res.groupId } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not join group. Please try again.';
      setError(message);
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

        {error && <Text className="text-sm text-red-500 text-center mb-4">{error}</Text>}

        <Button onPress={handleJoin} disabled={!canJoin} className="rounded-2xl py-4 w-full">
          <Text>{isJoining ? 'Joining...' : 'Join Group'}</Text>
        </Button>
      </View>
    </View>
  );
}
