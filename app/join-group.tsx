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
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('already a member')) {
        setError('You are already a member of this group.');
      } else if (raw.includes('No group found')) {
        setError('Invalid code. Please check and try again.');
      } else {
        setError('Could not join group. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <View className="flex flex-1 bg-background px-6">
      <Stack.Screen options={{ title: 'Join Group' }} />
      <View className="pt-8 items-center">
        <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Enter Join Code
        </Text>
        <Input
          className="mb-8 h-auto text-4xl ios:leading-0 font-bold text-center"
          placeholder="ABC123"
          value={cleanCode}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
          style={{
            letterSpacing: 6,
          }}
        />

        <Text className="text-sm text-muted-foreground mb-8 text-center">
          Ask the group creator for the 6-character code
        </Text>

        {error && <Text className="text-sm text-red-500 text-center mb-4">{error}</Text>}

        <Button onPress={handleJoin} disabled={!canJoin} className="rounded-2xl py-4 h-auto w-full">
          <Text>{isJoining ? 'Joining...' : 'Join Group'}</Text>
        </Button>
      </View>
    </View>
  );
}
