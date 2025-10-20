import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import SacariaModal from "../components/SacariaModal";
import { findOperationDetail } from "../mocks/mockOperationDetails";
import type {
  OperationCargoDetail,
  OperationDetail,
} from "../mocks/mockOperationDetails";

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

type OperationInfo = Pick<
  OperationDetail,
  | "code"
  | "operation"
  | "reservation"
  | "terminal"
  | "destination"
  | "vessel"
  | "exporter"
  | "deadline"
>;

const OPERATION_INFO_FIELDS: Array<{ key: keyof OperationInfo; label: string }> =
  [
    { key: "code", label: "ID" },
    { key: "operation", label: "Operacao" },
    { key: "reservation", label: "Reserva" },
    { key: "terminal", label: "Local (Terminal)" },
    { key: "destination", label: "Destino" },
    { key: "vessel", label: "Navio" },
    { key: "exporter", label: "Exportador" },
    { key: "deadline", label: "Deadline Draft" },
  ];

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
  const [isSacariaModalOpen, setIsSacariaModalOpen] = useState(false);
  const [sacariaInfo, setSacariaInfo] = useState<
    OperationCargoDetail | undefined
  >(
    detail
      ? {
          ...detail.cargo,
          images: [...detail.cargo.images],
        }
      : undefined,
  );
  const imageCount = sacariaInfo
    ? sacariaInfo.images.filter((uri) => uri.trim().length > 0).length
    : 0;
  useEffect(() => {
    if (detail) {
      setSacariaInfo({
        ...detail.cargo,
        images: [...detail.cargo.images],
      });
      return;
    }
    setSacariaInfo(undefined);
  }, [detail]);
  const [isEditingOperation, setIsEditingOperation] = useState(false);
  const [operationInfo, setOperationInfo] = useState<OperationInfo | undefined>(
    () =>
      detail
        ? {
            code: detail.code,
            operation: detail.operation,
            reservation: detail.reservation,
            terminal: detail.terminal,
            destination: detail.destination,
            vessel: detail.vessel,
            exporter: detail.exporter,
            deadline: detail.deadline,
          }
        : undefined,
  );
  const [draftOperationInfo, setDraftOperationInfo] = useState<
    OperationInfo | undefined
  >(operationInfo);

  const handleContainerPress = (containerId: string) => {
    router.push({
      pathname: "/main/ContainerDetails",
      params: { id: encodeURIComponent(containerId) },
    });
  };

  useEffect(() => {
    if (detail) {
      const nextInfo: OperationInfo = {
        code: detail.code,
        operation: detail.operation,
        reservation: detail.reservation,
        terminal: detail.terminal,
        destination: detail.destination,
        vessel: detail.vessel,
        exporter: detail.exporter,
        deadline: detail.deadline,
      };
      setOperationInfo(nextInfo);
      setDraftOperationInfo(nextInfo);
      setIsEditingOperation(false);
      return;
    }
    setOperationInfo(undefined);
    setDraftOperationInfo(undefined);
    setIsEditingOperation(false);
  }, [detail]);

  const handleEditOperationPress = () => {
    if (!operationInfo) return;
    setDraftOperationInfo(operationInfo);
    setIsEditingOperation(true);
  };

  const handleCancelEditOperation = () => {
    setDraftOperationInfo(operationInfo);
    setIsEditingOperation(false);
  };

  const handleSaveOperationInfo = () => {
    if (!draftOperationInfo) return;
    setOperationInfo(draftOperationInfo);
    setIsEditingOperation(false);
  };

  const displayedOperationInfo = isEditingOperation
    ? draftOperationInfo
    : operationInfo;

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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Informacoes da Operacao
              </Text>
              {!isEditingOperation && displayedOperationInfo && (
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.8}
                  onPress={handleEditOperationPress}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
            {detail ? (
              displayedOperationInfo ? (
                <>
                  <View style={styles.infoGrid}>
                    {OPERATION_INFO_FIELDS.map(({ key, label }) => (
                      <View key={key} style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>{label}</Text>
                        {isEditingOperation ? (
                          <TextInput
                            value={draftOperationInfo?.[key] ?? ""}
                            onChangeText={(text) =>
                              setDraftOperationInfo((prev) =>
                                prev
                                  ? ({ ...prev, [key]: text } as OperationInfo)
                                  : prev,
                              )
                            }
                            style={styles.textInput}
                            placeholder={label}
                            placeholderTextColor="#94A3B8"
                            autoCorrect={false}
                          />
                        ) : (
                          <Text style={styles.infoValue}>
                            {key === "deadline"
                              ? formatDate(displayedOperationInfo[key])
                              : displayedOperationInfo[key]}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                  {isEditingOperation && (
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        activeOpacity={0.8}
                        onPress={handleCancelEditOperation}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.cancelButtonText,
                          ]}
                        >
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        activeOpacity={0.8}
                        onPress={handleSaveOperationInfo}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.saveButtonText,
                          ]}
                        >
                          Salvar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    Informacoes nao disponiveis
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Nao foi possivel carregar os dados desta operacao.
                  </Text>
                </View>
              )
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sacaria</Text>
            </View>
            {sacariaInfo ? (
              <TouchableOpacity
                style={styles.sacariaSummaryCard}
                activeOpacity={0.85}
                onPress={() => setIsSacariaModalOpen(true)}
              >
                <View style={styles.sacariaSummaryLeft}>
                  <Text style={styles.sacariaTitle}>{sacariaInfo.title}</Text>
                  <Text style={styles.imageCountText}>
                    {imageCount} {imageCount === 1 ? "imagem" : "imagens"}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  Sacaria nao encontrada
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Nao foi possivel carregar as imagens desta operacao.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Containers da Operacao</Text>
              {detail && (
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/main/ContainerDetails",
                      params: { id: encodeURIComponent("novo") },
                    })
                  }
                >
                  <Text style={styles.editButtonText}>Novo</Text>
                </TouchableOpacity>
              )}
            </View>

            {detail ? (
              <View>
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
        cargo={sacariaInfo}
        onSave={(updated) => {
          setSacariaInfo({
            ...updated,
            images: [...updated.images],
          });
        }}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: "#49C5B6",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    fontSize: 11,
    color: "#6D7380",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2E40",
  },
  textInput: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(42, 46, 64, 0.12)",
    borderRadius: 12,
    fontSize: 14,
    color: "#2A2E40",
    backgroundColor: "#F8FAFC",
  },
  editActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "rgba(42, 46, 64, 0.08)",
  },
  cancelButtonText: {
    color: "#2A2E40",
  },
  saveButton: {
    backgroundColor: "#49C5B6",
  },
  saveButtonText: {
    color: "#FFFFFF",
  },
  sacariaSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(42, 46, 64, 0.08)",
  },
  sacariaSummaryLeft: {
    gap: 4,
  },
  sacariaTitle: {
    fontSize: 16,
    fontWeight: "700",
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
