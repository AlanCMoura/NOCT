import React, { useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import { router } from 'expo-router';
import CustomStatusBar from '../components/StatusBar';

cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });

const PROFILE_DATA = {
  firstName: 'Carlos',
  lastName: 'Oliveira',
  role: 'Gerente',
  email: 'carlos.oliveira@empresa.com',
  phone: '(11) 99999-0000',
  cpf: '123.456.789-00',
  twoFactorEnabled: true,
  createdAt: '2024-01-10',
  lastAccess: '2025-08-26 09:12',
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
  <View
    style={[
      styles.infoField,
      fullWidth && styles.infoFieldFullWidth,
    ]}
  >
    <Text className="text-xs uppercase" style={styles.fieldLabel}>
      {label}
    </Text>
    <Text
      className="text-base"
      style={[
        styles.fieldValue,
        highlight && styles.fieldValueHighlight,
      ]}
    >
      {value}
    </Text>
  </View>
);

const Profile = () => {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, 12) + 12;

  const initials = useMemo(() => {
    const firstInitial = PROFILE_DATA.firstName.charAt(0) || '';
    const lastInitial = PROFILE_DATA.lastName.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6F8FB' }}>
      <CustomStatusBar
        barStyle="dark-content"
        backgroundColor="#F6F8FB"
        translucent={true}
      />
      <View className="flex-1">
        <View
          className="w-full px-6 pb-4"
          style={[
            styles.header,
            { paddingTop: headerPaddingTop },
          ]}
        >
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
                  {PROFILE_DATA.firstName} {PROFILE_DATA.lastName}
                </Text>
                <Text className="text-xs" style={styles.userRole}>
                  {PROFILE_DATA.role}
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
                  {PROFILE_DATA.firstName} {PROFILE_DATA.lastName}
                </Text>
                <View style={styles.roleBadge}>
                  <Text className="text-xs font-semibold" style={styles.roleBadgeText}>
                    {PROFILE_DATA.role}
                  </Text>
                </View>
                <Text className="text-sm" style={styles.cardEmail}>
                  {PROFILE_DATA.email}
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
              <InfoField label="Nome" value={PROFILE_DATA.firstName} />
              <InfoField label="Sobrenome" value={PROFILE_DATA.lastName} />
              <InfoField label="CPF" value={PROFILE_DATA.cpf} highlight />
              <InfoField label="Telefone" value={PROFILE_DATA.phone} />
              <View style={styles.infoField}>
                <Text className="text-xs uppercase" style={styles.fieldLabel}>
                  Perfil
                </Text>
                <View style={styles.roleBadgeSmall}>
                  <Text
                    className="text-xs font-semibold"
                    style={styles.roleBadgeSmallText}
                  >
                    {PROFILE_DATA.role}
                  </Text>
                </View>
              </View>
              <InfoField
                label="Email"
                value={PROFILE_DATA.email}
                fullWidth
              />
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
                    PROFILE_DATA.twoFactorEnabled
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={styles.statusBadgeText}
                  >
                    {PROFILE_DATA.twoFactorEnabled ? 'Ativo' : 'Inativo'}
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
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(42, 46, 64, 0.08)',
    borderBottomWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconButton: {
    borderRadius: 9999,
    backgroundColor: 'rgba(73, 197, 182, 0.12)',
  },
  headerTitle: {
    color: '#2A2E40',
  },
  userName: {
    color: '#2A2E40',
  },
  userRole: {
    color: '#6D7380',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#49C5B6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#49C5B6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    color: '#2A2E40',
  },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E8EDF9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleBadgeText: {
    color: '#5046E5',
  },
  cardEmail: {
    marginTop: 6,
    color: '#6D7380',
  },
  sectionTitle: {
    color: '#2A2E40',
  },
  sectionSubtitle: {
    color: '#6D7380',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoColumn: {
    flexDirection: 'column',
    gap: 18,
  },
  infoField: {
    width: '50%',
    marginBottom: 18,
    paddingRight: 12,
  },
  infoFieldFullWidth: {
    width: '100%',
    paddingRight: 0,
  },
  fieldLabel: {
    color: '#6D7380',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fieldValue: {
    color: '#2A2E40',
    marginTop: 6,
    fontWeight: '600',
  },
  fieldValueHighlight: {
    fontWeight: '700',
  },
  roleBadgeSmall: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E8EDF9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleBadgeSmallText: {
    color: '#5046E5',
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(73, 197, 182, 0.16)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
  },
  statusBadgeText: {
    color: '#2A2E40',
  },
});

export default Profile;
