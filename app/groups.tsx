import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

type DialogState = {
  open: boolean;
  groupId: Id<'groups'> | null;
  groupName: string;
};

const DIALOG_CLOSED: DialogState = { open: false, groupId: null, groupName: '' };

export default function Groups() {
  const { dataConsent, convexUserId } = useApp();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  const [leaveDialog, setLeaveDialog] = useState<DialogState>(DIALOG_CLOSED);
  const [deleteDialog, setDeleteDialog] = useState<DialogState>(DIALOG_CLOSED);

  const groups = useQuery(
    api.groups.getMyGroups,
    dataConsent && convexUserId ? { userId: convexUserId as Id<'users'> } : 'skip'
  );

  const leaveGroup = useMutation(api.groups.leaveGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  if (!dataConsent) {
    return (
      <View className="flex flex-1 bg-background px-6 items-center justify-center">
        <Stack.Screen options={{ title: 'Groups' }} />
        <Ionicons name="lock-closed-outline" size={48} color="#9ca3af" />
        <Text className="text-lg font-semibold mt-4 text-center">Groups require data sharing</Text>
        <Text className="text-sm text-muted-foreground mt-2 text-center leading-5">
          To use Groups, you need to consent to sharing your BAC and drink data. Your personal info
          (weight, gender, timestamps) is never shared.
        </Text>
        <Button
          onPress={() => router.push('/privacy')}
          className="mt-6 rounded-2xl py-4 h-auto px-8">
          <Text>Go to Data & Privacy</Text>
        </Button>
      </View>
    );
  }

  async function handleLeave() {
    if (!leaveDialog.groupId) return;
    try {
      await leaveGroup({ groupId: leaveDialog.groupId, userId: convexUserId as Id<'users'> });
    } catch {
      // Mutation failure is visible via Convex's reactive queries
    }
    setLeaveDialog(DIALOG_CLOSED);
  }

  async function handleDelete() {
    if (!deleteDialog.groupId) return;
    try {
      await deleteGroup({ groupId: deleteDialog.groupId, userId: convexUserId as Id<'users'> });
    } catch {
      // Mutation failure is visible via Convex's reactive queries
    }
    setDeleteDialog(DIALOG_CLOSED);
  }

  return (
    <View className="flex flex-1 bg-background">
      <Stack.Screen options={{ title: 'Groups' }} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        <View className="flex-row gap-3 pt-6 mb-6">
          <Button
            onPress={() => router.push('/create-group')}
            className="flex-1 rounded-2xl py-4 h-auto">
            <Text>Create Group</Text>
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/join-group')}
            className="flex-1 border-2 border-indigo-500 rounded-2xl py-4 h-auto">
            <Text className="text-indigo-400 text-base font-semibold">Join Group</Text>
          </Button>
        </View>

        {groups === undefined ? (
          <Text className="text-muted-foreground text-center py-8">Loading...</Text>
        ) : groups.length === 0 ? (
          <Text className="text-muted-foreground text-center py-8">
            No groups yet.{'\n'}Create one or join with a code!
          </Text>
        ) : (
          groups.map((group) => (
            <Pressable
              key={group.groupId}
              onPress={() =>
                router.push({ pathname: '/session', params: { groupId: group.groupId } })
              }>
              <Card className="mb-3 p-4 py-4 gap-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-lg font-semibold flex-1">{group.name}</Text>
                  <View className="flex-row gap-1">
                    {group.memberType === 'admin' && (
                      <Pressable
                        onPress={() =>
                          setDeleteDialog({
                            open: true,
                            groupId: group.groupId,
                            groupName: group.name,
                          })
                        }
                        hitSlop={6}
                        className="p-2">
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() =>
                        setLeaveDialog({
                          open: true,
                          groupId: group.groupId,
                          groupName: group.name,
                        })
                      }
                      hitSlop={6}
                      className="p-2">
                      <Ionicons name="exit-outline" size={18} color="#6b7280" />
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-sm text-muted-foreground">Code: {group.joinCode}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {formatExpiry(group.expires)}
                  </Text>
                </View>
                {group.memberType === 'admin' && (
                  <Badge
                    variant="secondary"
                    className="self-start mt-2 bg-indigo-500/15 border-indigo-500/15">
                    <Text className="text-xs font-medium text-indigo-400">Admin</Text>
                  </Badge>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <AlertDialog
        open={leaveDialog.open}
        onOpenChange={(open) => {
          if (!open) setLeaveDialog(DIALOG_CLOSED);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave &quot;{leaveDialog.groupName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setLeaveDialog(DIALOG_CLOSED)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onPress={handleLeave}>
              <Text className="text-white">Leave</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(DIALOG_CLOSED);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteDialog.groupName}&quot; for all members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setDeleteDialog(DIALOG_CLOSED)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onPress={handleDelete}>
              <Text className="text-white">Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
