import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import SacariaModal from "../components/SacariaModal";
import { findOperationDetail } from "../mocks/mockOperationDetails";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
};

const StatusChip = ({ status }: { status: string }) => {
  const isActive = status.toLowerCase() === "em andamento";
  const isDone = status.toLowerCase() === "concluido";
  const backgroundColor = isDone
    ? "rgba(80, 70, 229, 0.12)"
    : isActive
      ? "rgba(73, 197, 182, 0.18)"
      : "rgba(226, 232, 240, 0.8)";
  const textColor = isDone ? "#5046E5" : isActive ? "#0F766E" : "#6D7380";

  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <Text style={[styles.statusChipText, { color: textColor }]}>
        {status}
      </Text>
    </View>
  );
};

const OperationDetails = () => {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, 12) + 12;
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const operationId = idParam ? parseInt(idParam, 10) : NaN;

  const detail = useMemo(() => {
    if (Number.isNaN(operationId)) return undefined;
    return findOperationDetail(operationId);
  }, [operationId]);

  const totalContainers = detail?.containers.length ?? 0;
  const imageCount = detail?.cargo.images.length ?? 0;
  const [isSacariaModalOpen, setIsSacariaModalOpen] = useState(false);

  const handleContainerPress = (containerId: string) => {
    Alert.alert("Container selecionado", containerId);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
      <CustomStatusBar
        barStyle="dark-content"
        backgroundColor="#F6F8FB"
        translucent={true}
      />
      <View className="flex-1">
        <View
          className="w-full px-6 pb-4"
          style={[styles.header, { paddingTop: headerPaddingTop }]}
        >
          <View className="flex-row items-center">
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
              <Text
                className="text-xl font-semibold"
                style={styles.headerTitle}
              >
                Operacao
              </Text>
              {detail && (
                <Text style={styles.headerSubtitle}>{detail.code}</Text>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text className="text-lg font-semibold" style={styles.sectionTitle}>
              Informacoes da Operacao
            </Text>
            {detail ? (
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>ID</Text>
                  <Text style={styles.infoValue}>{detail.code}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Operacao</Text>
                  <Text style={styles.infoValue}>{detail.operation}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Reserva</Text>
                  <Text style={styles.infoValue}>{detail.reservation}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Local (Terminal)</Text>
                  <Text style={styles.infoValue}>{detail.terminal}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Destino</Text>
                  <Text style={styles.infoValue}>{detail.destination}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Navio</Text>
                  <Text style={styles.infoValue}>{detail.vessel}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Exportador</Text>
                  <Text style={styles.infoValue}>{detail.exporter}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Deadline Draft</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(detail.deadline)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  Operacao nao encontrada
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Verifique se a operacao ainda esta disponivel na lista.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text className="text-lg font-semibold" style={styles.sectionTitle}>
              Containers da Operacao
            </Text>

            {detail ? (
              <View>
                <TouchableOpacity
                  style={styles.cargoCard}
                  activeOpacity={0.85}
                  onPress={() => setIsSacariaModalOpen(true)}
                >
                  <View style={styles.cargoAccent} />
                  <View style={styles.cargoHeader}>
                    <Text style={styles.cargoTitle}>{detail.cargo.title}</Text>
                    <Text style={styles.imageCountText}>
                      {imageCount} {imageCount === 1 ? "imagem" : "imagens"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.totalLabel}>
                  Total de containers:{" "}
                  <Text style={styles.totalValue}>{totalContainers}</Text>
                </Text>

                <FlatList
                  data={detail.containers}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.containerCard,
                        index !== detail.containers.length - 1 &&
                          styles.containerCardSpacing,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleContainerPress(item.id)}
                    >
                      <View style={styles.containerHeader}>
                        <Text style={styles.containerTitle}>{item.id}</Text>
                        <StatusChip status={item.status} />
                      </View>
                      <Text style={styles.containerWeight}>{item.weight}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Sem containers</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Nao ha containers para exibir nesta operacao.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      <SacariaModal
        visible={isSacariaModalOpen}
        onClose={() => setIsSacariaModalOpen(false)}
        cargo={detail?.cargo}
      />
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
  headerSubtitle: {
    color: "#6D7380",
    marginTop: 4,
    fontSize: 14,
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
    gap: 16,
  },
  sectionTitle: {
    color: "#2A2E40",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
  },
  infoColumn: {
    width: "47%",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6D7380",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2E40",
  },
  emptyState: {
    alignItems: "flex-start",
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2E40",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6D7380",
  },
  cargoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 10,
    overflow: "hidden",
  },
  cargoAccent: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 9999,
    backgroundColor: "#49C5B6",
    opacity: 0.6,
  },
  cargoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cargoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
    letterSpacing: 0.3,
  },
  cargoSubtitle: {
    fontSize: 14,
    color: "#6D7380",
  },
  imageCountText: {
    fontSize: 12,
    color: "#6D7380",
  },
  totalLabel: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
    color: "#2A2E40",
    fontWeight: "500",
  },
  totalValue: {
    fontWeight: "700",
    color: "#5046E5",
  },
  containerCardSpacing: {
    marginBottom: 12,
  },
  containerCard: {
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(42, 46, 64, 0.08)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    gap: 12,
  },
  containerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  containerWeight: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6D7380",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    minWidth: 110,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

export default OperationDetails;
