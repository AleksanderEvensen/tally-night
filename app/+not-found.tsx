import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <View className={styles.container}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className={styles.content}>
        <Text variant="h3">{"This screen doesn't exist."}</Text>
        <Link href="/" asChild>
          <Button variant="link" className={styles.link}>
            <Text>Go to home screen!</Text>
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = {
  container: 'flex flex-1 bg-white',
  content: 'flex-1 items-center justify-center px-6',
  link: 'mt-4 pt-4',
};
