import '../styles/global.css'
import { Slot } from "expo-router";
import { AuthProvider } from './contexts/AuthContext'; // ← ADICIONAR

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}


