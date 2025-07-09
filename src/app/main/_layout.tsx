import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Sem headers
      }}
    >
      <Stack.Screen name="logs" />
      <Stack.Screen name="form" />
    </Stack>
  );
}