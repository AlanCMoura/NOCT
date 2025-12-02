import "../styles/global.css";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { AuthProvider } from "./contexts/_AuthContext";

// Oculta banners de aviso no app; mantenha o console para debugging quando necessário
LogBox.ignoreAllLogs(true);

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
