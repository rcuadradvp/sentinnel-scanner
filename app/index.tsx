import { Stack, Link } from 'expo-router';

import { View } from 'react-native';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';
import { Button, ButtonText } from '@/components/ui/button';

export default function Home() {
  return (
    <View className={styles.container}>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <ScreenContent path="app/index.tsx" title="Home"></ScreenContent>
        <Link href={{ pathname: '/details', params: { name: 'Dan' } }} asChild>
          <Button variant="solid" size="md" action="primary">
            <ButtonText>Detalles</ButtonText>
          </Button>
        </Link>
      </Container>
    </View>
  );
}

const styles = {
  container: 'flex flex-1 bg-white',
};
