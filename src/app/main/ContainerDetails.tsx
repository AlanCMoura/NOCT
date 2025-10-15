import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Dimensions,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import {
  findContainerDetail,
  type ContainerDetail,
} from "../mocks/mockContainerDetails";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
};

const STATUS_MAP: Record<ContainerDetail["status"], { label: string; color: string; background: string }> = {
  "Nao iniciado": {
    label: "Nao iniciado",
    color: "#6D7380",
    background: "rgba(226, 232, 240, 0.8)",
  },
  "Em andamento": {
    label: "Em andamento",
    color: "#0F766E",
    background: "rgba(73, 197, 182, 0.18)",
  },
  Concluido: {
    label: "Concluido",
    color: "#5046E5",
    background: "rgba(80, 70, 229, 0.14)",
  },
};

const ContainerDetails = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const containerId = idParam ? decodeURIComponent(idParam) : undefined;

  const detail = useMemo(() => {
    if (!containerId) return undefined;
    return findContainerDetail(containerId);
  }, [containerId]);

  const [isInProgress, setIsInProgress] = useState(
    detail?.status === "Em andamento",
  );

  useEffect(() => {
    if (detail) {
      setIsInProgress(detail.status === "Em andamento");
    }
  }, [detail]);

  const handleToggleProgress = () => {
    setIsInProgress((prev) => !prev);
  };

  const handleEditPress = () => {
    Alert.alert("Editar container", "Funcionalidade em desenvolvimento.");
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Excluir container",
      "Esta acao nao pode ser desfeita. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive" },
      ],
    );
  };

  const headerPaddingTop = Math.max(insets.top, 12) + 12;

  const slideWidth = SCREEN_WIDTH - 64; // padding horizontal 24 + spacing cards

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
      <CustomStatusBar
        backgroundColor="#F6F8FB"
        barStyle="dark-content"
        translucent
      />
      <View className="flex-1">
        <View
          className="w-full px-6 pb-4"
          style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}
        >
          <View style={styles.headerRow}>
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
            <View style={styles.titleWrapper}>
              <Text style={styles.mainTitle} numberOfLines={1}>
                {detail?.code ?? "Container"}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Operacao {detail?.operationCode ?? "-"}
              </Text>
            </View>
          </View>
          {detail && (
            <View style={styles.statusWrapper}>
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: STATUS_MAP[detail.status].background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: STATUS_MAP[detail.status].color },
                  ]}
                >
                  {STATUS_MAP[detail.status].label}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditPress}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonLabel, styles.editButtonText]}>
                    Editar Container
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeletePress}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.actionButtonLabel, styles.deleteButtonText]}
                  >
                    Excluir Container
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Dados do Container</Text>
              <View style={styles.switchWrapper}>
                <Switch
                  trackColor={{ false: "#CBD5E1", true: "#49C5B6" }}
                  thumbColor="#FFFFFF"
                  value={isInProgress}
                  onValueChange={handleToggleProgress}
                />
                <Text style={styles.switchLabel}>Em andamento</Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <InfoColumn label="Container" value={detail?.code ?? "-"} />
              <InfoColumn
                label="Quantidade de Sacaria"
                value={detail?.sacariaQuantity ?? "-"}
              />
              <InfoColumn
                label="Tara"
                value={detail?.tare ?? "-"}
              />
              <InfoColumn
                label="Peso Liquido"
                value={detail?.netWeight ?? "-"}
              />
              <InfoColumn
                label="Peso Bruto"
                value={detail?.grossWeight ?? "-"}
              />
              <InfoColumn
                label="Lacre Agencia"
                value={detail?.sealAgency ?? "-"}
              />
              <InfoColumn
                label="Lacres Outros"
                value={detail?.otherSeals ?? "-"}
              />
              <InfoColumn
                label="Data Retirada Terminal"
                value={formatDate(detail?.pickupDate ?? "")}
              />
              <InfoColumn
                label="Data de Estufagem"
                value={formatDate(detail?.stuffingDate ?? "")}
              />
            </View>
          </View>

          {!detail && (
            <View style={styles.missingCard}>
              <Text style={styles.missingTitle}>Container nao encontrado</Text>
              <Text style={styles.missingSubtitle}>
                Verifique se o identificador informado esta correto ou selecione outro container.
              </Text>
            </View>
          )}

          {detail?.photoSections.map((section) => {
            const count = section.images.length;
            return (
              <View key={section.id} style={styles.carouselCard}>
                <View style={styles.carouselHeader}>
                  <Text style={styles.carouselTitle}>{section.title}</Text>
                  <Text style={styles.carouselCount}>
                    {count} {count === 1 ? "imagem" : "imagens"}
                  </Text>
                </View>
                {count > 0 ? (
                  <FlatList
                    data={section.images}
                    keyExtractor={(item, index) => `${section.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={slideWidth}
                    contentContainerStyle={styles.carouselContent}
                    ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    renderItem={({ item }) => (
                      <View style={[styles.carouselSlide, { width: slideWidth }]}>
                        <Image source={{ uri: item }} style={styles.carouselImage} />
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.carouselEmpty}>
                    <Text style={styles.carouselEmptyTitle}>Sem imagens</Text>
                    <Text style={styles.carouselEmptySubtitle}>
                      Nenhuma imagem registrada para esta etapa.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const InfoColumn = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.infoColumn}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(42, 46, 64, 0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    borderRadius: 9999,
    backgroundColor: "rgba(73, 197, 182, 0.12)",
  },
  titleWrapper: {
    flex: 1,
    gap: 6,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2E40",
  },
  subtitle: {
    fontSize: 14,
    color: "#6D7380",
  },
  statusWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 150,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#49C5B6",
  },
  deleteButton: {
    backgroundColor: "rgba(248, 113, 113, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  editButtonText: {
    color: "#FFFFFF",
  },
  deleteButtonText: {
    color: "#B91C1C",
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A2E40",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
  },
  infoColumn: {
    width: "48%",
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
  carouselCard: {
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
  carouselHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  carouselCount: {
    fontSize: 13,
    color: "#6D7380",
  },
  carouselContent: {
    paddingVertical: 6,
  },
  carouselSlide: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselEmpty: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  carouselEmptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2E40",
  },
  carouselEmptySubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  missingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    alignItems: "flex-start",
    gap: 8,
  },
  missingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  missingSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
});

export default ContainerDetails;
