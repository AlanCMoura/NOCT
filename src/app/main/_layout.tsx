import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Sem headers
      }}
    >
      <Stack.Screen name="Logs" />
      <Stack.Screen name="Form" />
      <Stack.Screen name="Profile" />
      <Stack.Screen name="OperationDetails" />
      <Stack.Screen name="ContainerDetails" />
    </Stack>
  );
}
