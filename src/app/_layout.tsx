import '../styles/global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/_AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="Register" />
        <Stack.Screen name="main" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
