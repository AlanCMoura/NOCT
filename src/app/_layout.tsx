import "../styles/global.css";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { AuthProvider } from "./contexts/_AuthContext";
import { OfflineOperationsProvider } from "./contexts/OfflineOperationsContext";

// Oculta banners de aviso no app; mantenha o console para debugging quando necessário
LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
    <AuthProvider>
      <OfflineOperationsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="Register" />
          <Stack.Screen name="main" options={{ headerShown: false }} />
        </Stack>
      </OfflineOperationsProvider>
    </AuthProvider>
  );
}
