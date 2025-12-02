import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import { useAuthenticatedFetch, useAuth } from "../contexts/_AuthContext";
import { API_BASE_URL } from "../../config/apiConfig";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

type ProfileData = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  role?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastAccess?: string;
};

const fallbackProfile: ProfileData = {
  firstName: "-",
  lastName: "",
  email: "-",
  phone: "-",
  cpf: "-",
  role: "-",
  twoFactorEnabled: false,
};

const formatCpf = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length !== 11) return value || "-";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length < 10) return value || "-";
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const InfoField = ({
  label,
  value,
  highlight = false,
  fullWidth = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  fullWidth?: boolean;
}) => (
  <View style={[styles.infoField, fullWidth && styles.infoFieldFullWidth]}>
    <Text className="text-xs uppercase" style={styles.fieldLabel}>
      {label}
    </Text>
    <Text
      className="text-base"
      style={[styles.fieldValue, highlight && styles.fieldValueHighlight]}
    >
      {value}
    </Text>
  </View>
);

const Profile = () => {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, 12) + 12;
  const authFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData>(fallbackProfile);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await authFetch(`${API_BASE_URL}/auth/me`);
      if (!resp.ok) {
        console.warn("Falha ao carregar perfil:", resp.status);
        setProfile(fallbackProfile);
        return;
      }
      const data = await resp.json();
      setProfile({
        id: data?.id,
        firstName: data?.firstName ?? data?.first_name ?? "-",
        lastName: data?.lastName ?? data?.last_name ?? "",
        email: data?.email ?? "-",
        phone: formatPhone(data?.phone ?? data?.telefone),
        cpf: formatCpf(data?.cpf),
        role: data?.role ?? data?.userRole ?? data?.authority ?? user?.role ?? "-",
        twoFactorEnabled: data?.twoFactorEnabled ?? data?.two_factor_enabled ?? user?.twoFactorEnabled ?? false,
        createdAt: data?.createdAt,
        lastAccess: data?.lastAccess,
      });
    } catch (err) {
      console.warn("Erro ao carregar perfil:", err);
      setProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  }, [authFetch, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(() => {
    const firstInitial = (profile.firstName || "").charAt(0);
    const lastInitial = (profile.lastName || "").charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [profile.firstName, profile.lastName]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
        <CustomStatusBar barStyle="dark-content" backgroundColor="#F6F8FB" translucent={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#49C5B6" />
          <Text style={{ marginTop: 12, color: "#2A2E40" }}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
      <CustomStatusBar barStyle="dark-content" backgroundColor="#F6F8FB" translucent={true} />
      <View className="flex-1">
        <View className="w-full px-6 pb-4" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center flex-shrink">
              <TouchableOpacity
                className="p-2 mr-3"
                activeOpacity={0.7}
                onPress={() => router.back()}
                style={styles.iconButton}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke="#2A2E40"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <View>
                <Text className="text-xl font-semibold" style={styles.headerTitle}>
                  Meu Perfil
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="items-end mr-3">
                <Text className="text-base font-semibold" style={styles.userName}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <Text className="text-xs" style={styles.userRole}>
                  {profile.role}
                </Text>
              </View>
              <View style={styles.avatar}>
                <Text className="text-lg font-semibold" style={styles.avatarText}>
                  {initials}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View className="flex-row items-center">
              <View style={styles.largeAvatar}>
                <Text className="text-2xl font-semibold" style={styles.avatarText}>
                  {initials}
                </Text>
              </View>
              <View className="ml-4">
                <Text className="text-xl font-semibold" style={styles.cardName}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <View style={styles.roleBadge}>
                  <Text className="text-xs font-semibold" style={styles.roleBadgeText}>
                    {profile.role}
                  </Text>
                </View>
                <Text className="text-sm" style={styles.cardEmail}>
                  {profile.email}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text className="text-lg font-semibold mb-1" style={styles.sectionTitle}>
              Informações Pessoais
            </Text>
            <Text className="text-sm mb-4" style={styles.sectionSubtitle}>
              Dados básicos do seu cadastro
            </Text>
            <View style={styles.infoGrid}>
              <InfoField label="Nome" value={profile.firstName || "-"} />
              <InfoField label="Sobrenome" value={profile.lastName || "-"} />
              <InfoField label="CPF" value={profile.cpf || "-"} highlight />
              <InfoField label="Telefone" value={profile.phone || "-"} />
              <View style={styles.infoField}>
                <Text className="text-xs uppercase" style={styles.fieldLabel}>
                  Perfil
                </Text>
                <View style={styles.roleBadgeSmall}>
                  <Text className="text-xs font-semibold" style={styles.roleBadgeSmallText}>
                    {profile.role || "-"}
                  </Text>
                </View>
              </View>
              <InfoField label="Email" value={profile.email || "-"} fullWidth />
            </View>
          </View>

          <View style={styles.card}>
            <Text className="text-lg font-semibold mb-1" style={styles.sectionTitle}>
              Segurança
            </Text>
            <Text className="text-sm mb-4" style={styles.sectionSubtitle}>
              Informações relacionadas ao acesso
            </Text>
            <View style={styles.infoColumn}>
              <View style={[styles.infoField, styles.infoFieldFullWidth]}>
                <Text className="text-xs uppercase" style={styles.fieldLabel}>
                  Autenticação de Dois Fatores (2FA)
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    profile.twoFactorEnabled ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <Text className="text-xs font-semibold" style={styles.statusBadgeText}>
                    {profile.twoFactorEnabled ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "rgba(42, 46, 64, 0.08)",
    borderBottomWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconButton: {
    borderRadius: 9999,
    backgroundColor: "rgba(73, 197, 182, 0.12)",
  },
  headerTitle: {
    color: "#2A2E40",
  },
  userName: {
    color: "#2A2E40",
  },
  userRole: {
    color: "#6D7380",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#49C5B6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#49C5B6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    color: "#2A2E40",
  },
  roleBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E8EDF9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleBadgeText: {
    color: "#5046E5",
  },
  cardEmail: {
    marginTop: 6,
    color: "#6D7380",
  },
  sectionTitle: {
    color: "#2A2E40",
  },
  sectionSubtitle: {
    color: "#6D7380",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoColumn: {
    flexDirection: "column",
    gap: 18,
  },
  infoField: {
    width: "50%",
    marginBottom: 18,
    paddingRight: 12,
  },
  infoFieldFullWidth: {
    width: "100%",
    paddingRight: 0,
  },
  fieldLabel: {
    color: "#6D7380",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  fieldValue: {
    color: "#2A2E40",
    marginTop: 6,
    fontWeight: "600",
  },
  fieldValueHighlight: {
    fontWeight: "700",
  },
  roleBadgeSmall: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E8EDF9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleBadgeSmallText: {
    color: "#5046E5",
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  statusBadgeActive: {
    backgroundColor: "rgba(73, 197, 182, 0.16)",
  },
  statusBadgeInactive: {
    backgroundColor: "rgba(226, 232, 240, 0.8)",
  },
  statusBadgeText: {
    color: "#2A2E40",
  },
});

export default Profile;
