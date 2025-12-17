import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Container } from '@/components/Container';

export default function NotFoundScreen() {
  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Container>
        <Text className="text-xl font-bold">Esta pantalla no existe.</Text>
        {/* ✅ CAMBIADO: Ir a scanner en lugar de home */}
        <Link href="/(app)/(tabs)/scanner" className="mt-4 pt-4">
          <Text className="text-base text-[#2e78b7]">Ir al inicio</Text>
        </Link>
      </Container>
    </View>
  );
}