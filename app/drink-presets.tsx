import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useApp } from '@/lib/context';
import { DEFAULT_DRINK_PRESETS } from '@/lib/drink-presets';

export default function DrinkPresets() {
  const { drinkPresets, setDrinkPresets } = useApp();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  function handleDelete(index: number) {
    const updated = drinkPresets.filter((_, i) => i !== index);
    setDrinkPresets(updated);
    setDeleteIndex(null);
  }

  function handleResetDefaults() {
    setDrinkPresets(DEFAULT_DRINK_PRESETS);
    setShowResetDialog(false);
  }

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Drink Presets' }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 24 }}>
        <Text variant="small" className="text-muted-foreground mb-3 uppercase tracking-wide">
          Your Presets
        </Text>

        {drinkPresets.length === 0 && (
          <View className="border-2 border-dashed border-gray-300 rounded-2xl py-8 items-center mb-4">
            <Text className="text-muted-foreground">No presets yet</Text>
          </View>
        )}

        {drinkPresets.map((preset, index) => (
          <React.Fragment key={preset.id}>
            <Card className="flex-row items-center p-4 mb-0 gap-0 rounded-2xl shadow-none">
              <Text className="text-3xl mr-3">{preset.emoji}</Text>
              <Pressable
                className="flex-1"
                onPress={() => router.push(`/edit-preset?index=${index}`)}>
                <Text className="text-base font-semibold">{preset.name}</Text>
                <Text variant="muted">
                  {preset.volumeMl}ml · {preset.alcoholPercent}%
                </Text>
              </Pressable>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setDeleteIndex(index)}
                className="ml-2">
                <Text className="text-lg text-muted-foreground">✕</Text>
              </Button>
            </Card>
            {index < drinkPresets.length - 1 && <Separator className="my-3" />}
            {index === drinkPresets.length - 1 && <View className="mb-3" />}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          onPress={() => router.push('/edit-preset')}
          className="border-2 border-dashed border-gray-300 rounded-2xl py-5 mb-6 h-auto flex-col">
          <Text className="text-2xl mb-1">+</Text>
          <Text className="text-muted-foreground">Add New Preset</Text>
        </Button>

        <Button
          variant="outline"
          onPress={() => setShowResetDialog(true)}
          className="rounded-2xl py-4 h-auto">
          <Text className="text-base font-semibold text-muted-foreground">Reset to Defaults</Text>
        </Button>
      </ScrollView>

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIndex !== null ? `Remove "${drinkPresets[deleteIndex]?.name}"?` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setDeleteIndex(null)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onPress={() => deleteIndex !== null && handleDelete(deleteIndex)}>
              <Text>Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your presets with the original defaults.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setShowResetDialog(false)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onPress={handleResetDefaults}>
              <Text>Reset</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
