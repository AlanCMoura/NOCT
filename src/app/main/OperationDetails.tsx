import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import CustomStatusBar from "../components/StatusBar";
import SacariaModal from "../components/SacariaModal";
import type {
  OperationCargoDetail,
  OperationDetail,
} from "../../types/operation";
import { API_BASE_URL } from "../../config/apiConfig";
import { useAuthenticatedFetch } from "../contexts/_AuthContext";
import { useOfflineOperations } from "../contexts/OfflineOperationsContext";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

const formatDate = (value: string | Date | undefined | null): string => {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "-";
  }
  return Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
};

const normalizeDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const StatusChip = ({ status }: { status: string }) => {
  const normalized = status?.toLowerCase?.() ?? "";
  const isOpen = ["open", "aberto", "em andamento", "in_progress"].includes(normalized);
  const isPartial = ["partial", "parcial", "partial_load", "partial_loaded", "pending"].includes(normalized);
  const isClosed = ["completed", "fechado", "fechada", "concluido", "closed", "complete", "completo"].includes(normalized);

  const backgroundColor = isClosed
    ? "rgba(34, 197, 94, 0.14)"
    : isPartial
      ? "rgba(250, 204, 21, 0.14)"
      : isOpen
        ? "rgba(73, 197, 182, 0.18)"
        : "rgba(226, 232, 240, 0.8)";
  const textColor = isClosed
    ? "#047857"
    : isPartial
      ? "#92400E"
      : isOpen
        ? "#0F766E"
        : "#6D7380";

  const displayLabel = isClosed ? "Completo" : isPartial ? "Parcial" : isOpen ? "Aberto" : status || "N/A";

  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <Text style={[styles.statusChipText, { color: textColor }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

type OperationInfo = {
  id: number;
  ctv: string;
  reservation: string;
  terminal: string;
  destination: string;
  ship: string;
  exporter: string;
  deadlineDraft: string;
  refClient: string;
  arrivalDate: string;
  loadDeadline: string;
  status: string;
};

const OPERATION_INFO_FIELDS: Array<{ key: keyof OperationInfo; label: string; isDate?: boolean }> = [
  { key: "id", label: "ID" },
  { key: "ctv", label: "CTV" },
  { key: "reservation", label: "Reserva" },
  { key: "terminal", label: "Local (Terminal)" },
  { key: "destination", label: "Destino" },
  { key: "ship", label: "Navio" },
  { key: "exporter", label: "Exportador" },
  { key: "deadlineDraft", label: "Deadline Draft", isDate: true },
  { key: "refClient", label: "Ref. Cliente" },
  { key: "arrivalDate", label: "Data de Chegada", isDate: true },
  { key: "loadDeadline", label: "Deadline de Carregamento", isDate: true },
];

type ApiOperation = {
  id?: number;
  ctv?: string;
  reservation?: string;
  terminal?: string;
  destination?: string;
  ship?: string;
  exporter?: string;
  deadlineDraft?: string;
  refClient?: string;
  arrivalDate?: string;
  loadDeadline?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  containers?: any[];
};

type ApiSackImage = {
  id?: string | number;
  imageUrl?: string;
  imageKey?: string;
  uploadedAt?: string;
  expirationMinutes?: number;
};

type ApiContainer = {
  id?: number;
  containerId?: string;
  ctv?: string;
  grossWeight?: number | string;
  weight?: string;
  status?: string;
  description?: string;
  sacksCount?: number;
  tareTons?: number;
  liquidWeight?: number;
  agencySeal?: string;
  otherSeals?: string[];
};

const normalizeSackImages = (images?: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  (images ?? []).forEach((uri) => {
    const trimmed = (uri ?? "").trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    normalized.push(trimmed);
  });

  return normalized;
};

const OperationDetails = () => {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, 12) + 12;
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const operationId = idParam ? decodeURIComponent(idParam) : undefined;
  const authFetch = useAuthenticatedFetch();
  const { pendingSummaries, isSyncing, syncPendingOperations } = useOfflineOperations();

  const [detail, setDetail] = useState<ApiOperation | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSacariaModalOpen, setIsSacariaModalOpen] = useState(false);
  const [sacariaInfo, setSacariaInfo] = useState<OperationCargoDetail | undefined>(undefined);
  const [isEditingOperation, setIsEditingOperation] = useState(false);
  const [operationInfo, setOperationInfo] = useState<OperationInfo | undefined>(undefined);
  const [draftOperationInfo, setDraftOperationInfo] = useState<OperationInfo | undefined>();
  const [containers, setContainers] = useState<ApiContainer[]>([]);
  const [containersLoading, setContainersLoading] = useState<boolean>(false);
  const [sackImageIdMap, setSackImageIdMap] = useState<Record<string, number>>({});
  const [isOffline, setIsOffline] = useState(false);

  const totalContainers = containers.length > 0 ? containers.length : detail?.containers?.length ?? 0;
  const sacariaImages = useMemo(() => normalizeSackImages(sacariaInfo?.images), [sacariaInfo?.images]);
  const imageCount = sacariaImages.length;
  const isOperationClosed = detail?.status?.toUpperCase() === "COMPLETED";
  const pendingContainers = useMemo(
    () =>
      pendingSummaries.filter(
        (p) => p.type?.includes("container") && operationId && String(p.operationId ?? "") === String(operationId)
      ),
    [pendingSummaries, operationId]
  );

  const isLocalUri = (uri: string) =>
    typeof uri === "string" &&
    (uri.startsWith("file://") || uri.startsWith("content://"));

  // ========== NAVEGAÇÃO PARA CRIAR CONTAINER ==========
  const handleCreateContainer = () => {
    if (!operationId) return;

    router.push({
      pathname: "/main/ContainerDetails",
      params: {
        id: "create",
        operationId: operationId,
        operationCode: detail?.ctv || detail?.reservation || "",
        operationName: detail?.destination || "",
      },
    });
  };

  // ========== FUNÇÕES DE SACARIA ==========
  const uploadSackImages = async (imageUris: string[]): Promise<boolean> => {
    const locals = imageUris.filter((uri) => isLocalUri(uri));
    if (locals.length === 0 || !operationId) return true;

    const form = new FormData();
    locals.forEach((uri, index) => {
      const filename = uri.split("/").pop() || `sack_image_${index}.jpg`;
      form.append("sackImages", {
        uri,
        name: filename,
        type: "image/jpeg",
      } as any);
    });

    try {
      console.log(`📤 Enviando ${locals.length} imagens para operação ${operationId}`);
      const response = await authFetch(
        `${API_BASE_URL}/operations/${operationId}/sack-images`,
        {
          method: "POST",
          body: form,
        },
      );

      console.log(`📥 Resposta do upload: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro no upload: ${response.status} - ${errorText}`);
        Alert.alert("Erro", `Erro ${response.status} ao enviar sacaria`);
        return false;
      }

      console.log("✅ Upload de sacaria concluído com sucesso");
      return true;
    } catch (error) {
      console.error("❌ Erro de rede no upload:", error);
      Alert.alert("Erro", "Não foi possível enviar as imagens de sacaria.");
      return false;
    }
  };

  const mapApiToOperationInfo = (api: ApiOperation): OperationInfo => {
    return {
      id: api.id ?? 0,
      ctv: api.ctv ?? "-",
      reservation: api.reservation ?? "-",
      terminal: api.terminal ?? "-",
      destination: api.destination ?? "-",
      ship: api.ship ?? "-",
      exporter: api.exporter ?? "-",
      deadlineDraft: api.deadlineDraft ?? "-",
      refClient: api.refClient ?? "-",
      arrivalDate: api.arrivalDate ?? "-",
      loadDeadline: api.loadDeadline ?? "-",
      status: api.status ?? "OPEN",
    };
  };

  const fetchSackImages = async (id: string) => {
    try {
      const sackResponse = await authFetch(
        `${API_BASE_URL}/operations/${id}/sack-images?expirationMinutes=60`,
      );
      if (sackResponse.ok) {
        const sackData: ApiSackImage[] = await sackResponse.json();
        const idMap: Record<string, number> = {};
        const urls = sackData
          .map((item) => {
            const url = item?.imageUrl || (item as any)?.signedUrl || (item as any)?.url;
            const trimmed = url?.trim();
            if (trimmed && item?.id != null) {
              const numericId = Number(item.id);
              if (!Number.isNaN(numericId)) {
                idMap[trimmed] = numericId;
              }
            }
            return trimmed;
          })
          .filter((u): u is string => !!u && u.length > 0);
        setSacariaInfo({
          title: "Sacaria",
          description: "Imagens da sacaria desta operacao",
          images: normalizeSackImages(urls),
          notes: undefined,
        });
        setSackImageIdMap(idMap);
        return;
      }

      if (sackResponse.status === 404) {
        setSacariaInfo({
          title: "Sacaria",
          description: "Imagens da sacaria desta operacao",
          images: [],
          notes: undefined,
        });
        setSackImageIdMap({});
        return;
      }
    } catch (e) {
      console.error("Erro ao buscar imagens de sacaria:", e);
    }

    setSacariaInfo({
      title: "Sacaria",
      description: "Imagens da sacaria desta operacao",
      images: [],
      notes: undefined,
    });
    setSackImageIdMap({});
  };

  const fetchContainers = async (id: string) => {
    setContainersLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/containers/by-operation/${id}?page=0&size=200&sortBy=id&sortDirection=ASC`,
      );
      if (response.ok) {
        const data = await response.json();
        const items: ApiContainer[] = Array.isArray(data?.content) ? data.content : [];
        setContainers(items);
        setDetail((prev) => (prev ? { ...prev, containers: items as any[] } : prev));
        return;
      }
    } catch (error) {
      console.error("Erro ao buscar containers da operação:", error);
    } finally {
      setContainersLoading(false);
    }
  };

  const fetchOperation = async () => {
    if (!operationId) {
      setFetchError("Operação não encontrada");
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/operations/${operationId}`);
      if (!response.ok) {
        setFetchError(`Erro ${response.status} ao carregar operação`);
        setDetail(undefined);
        setSacariaInfo(undefined);
        return;
      }
      const apiData: ApiOperation = await response.json();
      
      console.log("📥 Dados da operação recebidos:", apiData);
      
      setDetail(apiData);
      
      const mapped = mapApiToOperationInfo(apiData);
      setOperationInfo(mapped);
      setDraftOperationInfo(mapped);
      setIsEditingOperation(false);
      
      await fetchSackImages(operationId);
      await fetchContainers(operationId);
    } catch (error) {
      console.error("Erro ao buscar operação:", error);
      setFetchError("Erro ao buscar operação");
      setDetail(undefined);
      setSacariaInfo(undefined);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar containers ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      if (operationId && !loading) {
        fetchContainers(operationId);
      }
    }, [operationId])
  );

  useEffect(() => {
    fetchOperation();
  }, [operationId]);

  // Monitorar conectividade para exibir aviso e disparar sync quando voltar
  useEffect(() => {
    const init = async () => {
      const state = await NetInfo.fetch();
      const offline = !(state?.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      if (!offline) {
        syncPendingOperations();
      }
    };
    init();
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state?.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      if (!offline) {
        syncPendingOperations();
      }
    });
    return () => unsubscribe();
  }, [syncPendingOperations]);

  // Monitorar rede para exibir banner e disparar sync ao voltar
  useEffect(() => {
    const init = async () => {
      const state = await NetInfo.fetch();
      const offline = !(state?.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      if (!offline) {
        syncPendingOperations();
      }
    };
    init();
    const unsub = NetInfo.addEventListener((state) => {
      const offline = !(state?.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      if (!offline) {
        syncPendingOperations();
      }
    });
    return () => unsub();
  }, [syncPendingOperations]);

  const handleEditOperationPress = () => {
    if (!operationInfo || isOperationClosed) return;
    setDraftOperationInfo({ ...operationInfo });
    setIsEditingOperation(true);
  };

  const handleCancelEditOperation = () => {
    setDraftOperationInfo(operationInfo ? { ...operationInfo } : undefined);
    setIsEditingOperation(false);
  };

  const handleSaveOperationInfo = async () => {
    if (!draftOperationInfo || !operationId) return;
    
    const payload = {
      ctv: draftOperationInfo.ctv,
      reservation: draftOperationInfo.reservation,
      terminal: draftOperationInfo.terminal,
      destination: draftOperationInfo.destination,
      ship: draftOperationInfo.ship,
      exporter: draftOperationInfo.exporter,
      deadlineDraft: draftOperationInfo.deadlineDraft,
      refClient: draftOperationInfo.refClient,
      arrivalDate: draftOperationInfo.arrivalDate,
      loadDeadline: draftOperationInfo.loadDeadline,
      status: draftOperationInfo.status,
    };

    try {
      const response = await authFetch(`${API_BASE_URL}/operations/${operationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Alert.alert("Erro", `Erro ao salvar operação: ${response.status}\n${errorText}`);
        return;
      }

      const updated: ApiOperation = await response.json();
      const mapped = mapApiToOperationInfo(updated);

      setDetail(updated);
      setOperationInfo(mapped);
      setDraftOperationInfo(mapped);
      setIsEditingOperation(false);
      Alert.alert("Sucesso", "Operação atualizada.");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a operação.");
    }
  };

  const deleteSackImages = async (imagesToDelete: string[]): Promise<boolean> => {
    if (!operationId || imagesToDelete.length === 0) return true;

    for (const imageUrl of imagesToDelete) {
      const imageId = sackImageIdMap[imageUrl];
      if (!imageId) {
        console.warn(`ID não encontrado para imagem: ${imageUrl}`);
        continue;
      }

      try {
        const response = await authFetch(
          `${API_BASE_URL}/operations/${operationId}/sack-images/${imageId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          console.error(`Erro ao excluir imagem ${imageId}: ${response.status}`);
          Alert.alert("Erro", "Nao foi possivel excluir uma das imagens da sacaria.");
          return false;
        }
      } catch (error) {
        console.error("Erro de rede ao excluir imagem de sacaria:", error);
        Alert.alert("Erro", "Nao foi possivel excluir uma das imagens da sacaria.");
        return false;
      }
    }

    return true;
  };

  const handleSaveSacaria = async (updated: OperationCargoDetail) => {
    const normalizedImages = normalizeSackImages(updated.images);
    const removedRemoteImages = sacariaImages.filter((uri) => !normalizedImages.includes(uri));

    setSacariaInfo({
      ...updated,
      images: normalizedImages,
    });

    const deleted = await deleteSackImages(
      removedRemoteImages.filter((uri) => uri && !isLocalUri(uri)),
    );
    if (!deleted) return;

    const success = await uploadSackImages(normalizedImages);
    if (success && operationId) {
      setTimeout(async () => {
        await fetchSackImages(operationId);
      }, 500);
    }
  };

  const displayedOperationInfo = isEditingOperation
    ? draftOperationInfo
    : operationInfo;

  const handleContainerPress = (containerId: string) => {
    router.push({
      pathname: "/main/ContainerDetails",
      params: { 
        id: encodeURIComponent(containerId),
        operationId: operationId,
      },
    });
  };

  const normalizedContainers = useMemo(() => {
    return containers.map((item, idx) => ({
      id: item?.containerId || String(item?.id) || `CNTR-${idx + 1}`,
      weight: item?.grossWeight ? String(item.grossWeight) : item?.weight || "",
      status: item?.status || "OPEN",
    }));
  }, [containers]);

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
          <View className="flex-row items-center justify-between">
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
                  Operação
                </Text>
                {detail && (
                  <Text style={styles.headerSubtitle}>{detail.ctv || `OP-${detail.id}`}</Text>
                )}
              </View>
            </View>
            {detail && (
              <StatusChip status={detail.status || "OPEN"} />
            )}
          </View>
        </View>

        {isOffline && pendingContainers.length > 0 && (
          <View style={styles.pendingBanner}>
            <View style={styles.pendingBannerHeader}>
              <ActivityIndicator size="small" color="#92400E" />
              <Text style={styles.pendingBannerTitle}>Containers pendentes</Text>
            </View>
            <Text style={styles.pendingBannerText}>
              {pendingContainers.map((p) => p.containerId ?? p.label).join(", ")}
            </Text>
            {isSyncing && (
              <Text style={styles.pendingBannerSync}>Sincronizando quando a conexão voltar...</Text>
            )}
          </View>
        )}

        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Card de Informações da Operação */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informações da Operação</Text>
              {!isEditingOperation && displayedOperationInfo && !isOperationClosed && (
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.8}
                  onPress={handleEditOperationPress}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#49C5B6" />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : fetchError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Operação não encontrada</Text>
                <Text style={styles.emptyStateSubtitle}>{fetchError}</Text>
              </View>
            ) : displayedOperationInfo ? (
              <>
                <View style={styles.infoGrid}>
                  {OPERATION_INFO_FIELDS.map(({ key, label, isDate }) => (
                    <View key={key} style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>{label}</Text>
                      {isEditingOperation && key !== "id" && key !== "status" ? (
                        <TextInput
                          value={
                            isDate
                              ? normalizeDateInput(String(draftOperationInfo?.[key] ?? ""))
                              : String(draftOperationInfo?.[key] ?? "")
                          }
                          onChangeText={(text) => {
                            const nextValue = isDate ? normalizeDateInput(text) : text;
                            setDraftOperationInfo((prev) =>
                              prev ? { ...prev, [key]: nextValue } : prev
                            );
                          }}
                          style={styles.textInput}
                          placeholder={label}
                          placeholderTextColor="#94A3B8"
                          autoCorrect={false}
                          keyboardType={isDate ? "numeric" : "default"}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {isDate
                            ? formatDate(String(displayedOperationInfo[key] ?? ""))
                            : displayedOperationInfo[key] || "-"}
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
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      activeOpacity={0.8}
                      onPress={handleSaveOperationInfo}
                    >
                      <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                        Salvar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Informações não disponíveis</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Não foi possível carregar os dados desta operação.
                </Text>
              </View>
            )}
          </View>

          {/* Card de Sacaria */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sacaria</Text>
            </View>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#49C5B6" />
                <Text style={styles.loadingText}>Carregando sacaria...</Text>
              </View>
            ) : sacariaInfo ? (
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
                <Text style={styles.emptyStateTitle}>Sacaria não encontrada</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Não foi possível carregar as imagens desta operação.
                </Text>
              </View>
            )}
          </View>

          {/* Card de Containers */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Containers da Operação</Text>
              {!isOperationClosed && (
                <TouchableOpacity
                  style={styles.createButton}
                  activeOpacity={0.85}
                  onPress={handleCreateContainer}
                >
                  <Text style={styles.createButtonText}>+ Criar</Text>
                </TouchableOpacity>
              )}
            </View>

            {(loading || containersLoading) ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#49C5B6" />
                <Text style={styles.loadingText}>Carregando containers...</Text>
              </View>
            ) : normalizedContainers.length > 0 ? (
              <View>
                <Text style={styles.totalLabel}>
                  Total de containers:{" "}
                  <Text style={styles.totalValue}>{totalContainers}</Text>
                </Text>

                <FlatList
                  data={normalizedContainers}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.containerCard,
                        index !== normalizedContainers.length - 1 &&
                          styles.containerCardSpacing,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleContainerPress(item.id)}
                    >
                      <View style={styles.containerHeader}>
                        <Text style={styles.containerTitle}>{item.id}</Text>
                        <StatusChip status={item.status} />
                      </View>
                      {item.weight && (
                        <Text style={styles.containerWeight}>Peso bruto: {item.weight} ton</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Sem containers</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Clique em "+ Criar" para adicionar um container.
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
        onSave={handleSaveSacaria}
        isOperationClosed={isOperationClosed}
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
  pendingBanner: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.5)",
    gap: 4,
  },
  pendingBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  pendingBannerText: {
    fontSize: 13,
    color: "#92400E",
  },
  pendingBannerSync: {
    fontSize: 12,
    color: "#92400E",
    opacity: 0.8,
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
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: "#49C5B6",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    minWidth: 100,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#2A2E40",
  },
});

export default OperationDetails;
