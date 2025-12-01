import React, { useEffect, useState, useCallback } from "react";
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
  TextInput,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import {
  type ContainerDetail,
  type ContainerStatus,
  type ContainerPhotoSection,
  createEmptyPhotoSections,
} from "../types/container";
import * as ImagePicker from "expo-image-picker";
import { useAuthenticatedFetch } from "../contexts/_AuthContext";
import { API_BASE_URL } from "../config/apiConfig";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_ITEM_SPACING = 16;

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
};

const STATUS_MAP: Record<ContainerStatus, { label: string; color: string; background: string }> = {
  Aberto: {
    label: "Aberto",
    color: "#0F766E",
    background: "rgba(73, 197, 182, 0.18)",
  },
  Parcial: {
    label: "Parcial",
    color: "#92400E",
    background: "rgba(250, 204, 21, 0.14)",
  },
  Completo: {
    label: "Completo",
    color: "#047857",
    background: "rgba(34, 197, 94, 0.14)",
  },
};

const STATUS_OPTIONS: ContainerStatus[] = ["Aberto", "Parcial", "Completo"];

// Mapeamento de status da API para o frontend
const mapStatusFromApi = (value?: string): ContainerStatus => {
  const upper = (value || "").toUpperCase();
  if (upper === "COMPLETED" || upper.includes("COMPLET") || upper.includes("FECH")) return "Completo";
  if (upper === "PENDING" || upper.includes("PEND") || upper.includes("PARC")) return "Parcial";
  return "Aberto";
};

// Mapeamento de status do frontend para a API
const mapStatusToApi = (status: ContainerStatus): string => {
  if (status === "Completo") return "COMPLETED";
  if (status === "Parcial") return "PENDING";
  return "OPEN";
};

type FetchedImage = {
  url: string;
  id?: string;
};

// Mapeamento de categorias de imagem (frontend -> API)
const CATEGORY_SECTIONS: Array<{
  id: string;
  title: string;
  apiCategory: string;
  uploadField: string;
}> = [
  { id: "empty", title: "Vazio/Forrado", apiCategory: "VAZIO_FORRADO", uploadField: "vazioForrado" },
  { id: "partial", title: "Fiada", apiCategory: "FIADA", uploadField: "fiada" },
  { id: "full", title: "Cheio/Aberto", apiCategory: "CHEIO_ABERTO", uploadField: "cheioAberto" },
  { id: "half-door", title: "Meia Porta", apiCategory: "MEIA_PORTA", uploadField: "meiaPorta" },
  { id: "closed", title: "Lacrado/Fechado", apiCategory: "LACRADO_FECHADO", uploadField: "lacradoFechado" },
  { id: "seals", title: "Lacres Principais", apiCategory: "LACRES_PRINCIPAIS", uploadField: "lacresPrincipal" },
  { id: "other-seals", title: "Outros Lacres", apiCategory: "LACRES_OUTROS", uploadField: "lacresOutros" },
];

type InfoField = {
  key: keyof ContainerDetail;
  label: string;
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
};

// Tipo da resposta da API de container
type ApiContainer = {
  id?: number;
  containerId?: string;
  description?: string;
  operationId?: number;
  operation?: { id?: number; ctv?: string };
  sacksCount?: number;
  tareTons?: number;
  liquidWeight?: number;
  grossWeight?: number;
  agencySeal?: string;
  otherSeals?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Tipo para imagens com metadados
type ImageWithMeta = {
  uri: string;
  isLocal: boolean; // true = imagem local (file://), false = imagem do S3
};

const buildEmptyContainer = (overrides?: Partial<ContainerDetail>): ContainerDetail => {
  const base: ContainerDetail = {
    id: "",
    code: "",
    description: "",
    operationCode: "",
    operationName: "",
    status: "Aberto",
    sacariaQuantity: "",
    tare: "",
    netWeight: "",
    grossWeight: "",
    sealAgency: "",
    otherSeals: "",
    pickupDate: "",
    stuffingDate: "",
    photoSections: createEmptyPhotoSections(),
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    photoSections: overrides.photoSections?.length ? overrides.photoSections : base.photoSections,
  };
};

const ContainerDetails = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const containerId = idParam ? decodeURIComponent(idParam) : undefined;
  const normalizedId = containerId?.toLowerCase();

  const decodeParam = (value: string | string[] | undefined) => {
    if (!value) return undefined;
    const single = Array.isArray(value) ? value[0] : value;
    try {
      return decodeURIComponent(single);
    } catch {
      return single;
    }
  };

  const operationCodeParam = decodeParam(params.operationCode);
  const operationNameParam = decodeParam(params.operationName);
  const isCreateMode =
    !containerId ||
    normalizedId === "novo" ||
    normalizedId === "new" ||
    normalizedId === "create";

  const authFetch = useAuthenticatedFetch();

  // Estados principais
  const [currentDetail, setCurrentDetail] = useState<ContainerDetail | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDetail, setDraftDetail] = useState<ContainerDetail | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para rastrear imagens originais (para detectar remoções)
  const [originalImages, setOriginalImages] = useState<Record<string, string[]>>({});
  const [imageIdMap, setImageIdMap] = useState<Record<string, Record<string, string>>>({});

  // Mapear resposta da API para ContainerDetail
  const mapContainerDetail = useCallback(
    (api: ApiContainer, idFallback: string): ContainerDetail => {
      return {
        id: api?.containerId || String(api?.id) || idFallback || "",
        code: api?.containerId || String(api?.id) || idFallback || "",
        description: api?.description ?? "",
        operationCode: String(api?.operationId ?? api?.operation?.id ?? operationCodeParam ?? ""),
        operationName: api?.operation?.ctv ?? operationNameParam ?? "",
        status: mapStatusFromApi(api?.status),
        sacariaQuantity: api?.sacksCount != null ? String(api.sacksCount) : "",
        tare: api?.tareTons != null ? String(api.tareTons) : "",
        netWeight: api?.liquidWeight != null ? String(api.liquidWeight) : "",
        grossWeight: api?.grossWeight != null ? String(api.grossWeight) : "",
        sealAgency: api?.agencySeal ?? "",
        otherSeals: Array.isArray(api?.otherSeals) ? api.otherSeals.join(", ") : "",
        pickupDate: "",
        stuffingDate: "",
        photoSections: createEmptyPhotoSections(),
      };
    },
    [operationCodeParam, operationNameParam]
  );

// Buscar imagens por categoria
const fetchImagesByCategory = async (
    id: string,
    apiCategory: string
  ): Promise<{ urls: string[]; idMap: Record<string, string> }> => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/containers/${encodeURIComponent(id)}/images/${apiCategory}?expirationMinutes=120`
      );

      if (!response.ok) {
        if (response.status === 404) return { urls: [], idMap: {} };
        console.warn(`Erro ao buscar imagens ${apiCategory}: ${response.status}`);
        return { urls: [], idMap: {} };
      }

      const data = await response.json();

      const urls: string[] = [];
      const idMap: Record<string, string> = {};

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const url =
            typeof item === "string"
              ? item
              : item?.imageUrl || item?.signedUrl || item?.url;
          const id = item?.id ?? item?.imageId ?? item?.imageKey;
          if (typeof url === "string" && url.length > 0) {
            urls.push(url);
            if (id != null) idMap[url] = String(id);
          }
        });
      }

      return { urls, idMap };
    } catch (err) {
      console.warn(`Erro ao buscar imagens ${apiCategory}:`, err);
      return { urls: [], idMap: {} };
    }
  };

  // Excluir imagens removidas
  const deleteImagesByCategory = async (
    id: string,
    _apiCategory: string,
    payload: { urls: string[]; ids: string[]; urlToId?: Record<string, string> }
  ): Promise<boolean> => {
    const { urls, ids, urlToId = {} } = payload;
    if (urls.length === 0 && ids.length === 0) return true;

    const deleteById = async (imageId: string) => {
      try {
        const resp = await authFetch(
          `${API_BASE_URL}/containers/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
          { method: "DELETE" }
        );
        return resp.ok || resp.status === 404;
      } catch (err) {
        console.warn(`Erro ao excluir imagem ${imageId}:`, err);
        return false;
      }
    };

    // Prioriza IDs; se não houver, tenta pela URL (caso o backend aceite imageUrl como query)
    const deleteByUrl = async (url: string) => {
      try {
        const resp = await authFetch(
          `${API_BASE_URL}/containers/${encodeURIComponent(id)}/images?imageUrl=${encodeURIComponent(url)}`,
          { method: "DELETE" }
        );
        return resp.ok || resp.status === 404;
      } catch (err) {
        console.warn(`Erro ao excluir imagem por URL:`, err);
        return false;
      }
    };

    const results: boolean[] = [];

    if (ids.length > 0) {
      const idResults = await Promise.all(ids.map((imageId) => deleteById(imageId)));
      results.push(...idResults);
    }

    const urlsWithoutId = urls.filter((url) => !urlToId[url]);
    if (urlsWithoutId.length > 0) {
      const urlResults = await Promise.all(urlsWithoutId.map((url) => deleteByUrl(url)));
      results.push(...urlResults);
    }

    return results.every(Boolean);
  };

  // Buscar todas as imagens do container
  const fetchAllImages = async (id: string): Promise<ContainerPhotoSection[]> => {
    const idMapAccumulator: Record<string, Record<string, string>> = {};

    const sectionsWithImages = await Promise.all(
      CATEGORY_SECTIONS.map(async (section) => {
        const { urls, idMap } = await fetchImagesByCategory(id, section.apiCategory);
        idMapAccumulator[section.id] = idMap;
        return {
          id: section.id,
          title: section.title,
          images: urls,
        };
      })
    );

    const originals: Record<string, string[]> = {};
    sectionsWithImages.forEach((section) => {
      originals[section.id] = [...section.images];
    });
    setOriginalImages(originals);
    setImageIdMap(idMapAccumulator);

    return sectionsWithImages;
  };

  // Buscar detalhes do container
  const fetchContainerDetail = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/containers/${encodeURIComponent(id)}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Container não encontrado");
        } else {
          setError(`Erro ${response.status} ao carregar container`);
        }
        setCurrentDetail(undefined);
        return;
      }

      const apiData: ApiContainer = await response.json();
      console.log("📥 Dados do container recebidos:", apiData);

      const mapped = mapContainerDetail(apiData, id);

      // Buscar imagens de todas as categorias
      const photoSections = await fetchAllImages(id);

      setCurrentDetail({ ...mapped, photoSections });
      setIsEditing(false);
      setDraftDetail(undefined);
    } catch (err) {
      console.error("Erro ao buscar container:", err);
      setError("Não foi possível carregar o container.");
      setCurrentDetail(undefined);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados
  useEffect(() => {
    if (!containerId || isCreateMode) return;
    fetchContainerDetail(containerId);
  }, [containerId, isCreateMode]);

  // Valores derivados
  const baseDetail = currentDetail;
  const displayDetail = isEditing && draftDetail ? draftDetail : baseDetail;
  const safeStatus = displayDetail?.status ?? "Aberto";
  const statusInfo = STATUS_MAP[safeStatus] ?? STATUS_MAP["Aberto"];
  const isContainerCompleted = displayDetail?.status === "Completo";

  // Handlers de edição
  const handleCompleteToggle = (value: boolean) => {
    if (!value || isContainerCompleted || saving) return;
    handleCompleteContainer();
  };

  const handleEditPress = () => {
    if (!baseDetail || isContainerCompleted) return;
    setDraftDetail({ ...baseDetail });
    setIsEditing(true);
  };

  const updateDraft = <K extends keyof ContainerDetail>(key: K, value: ContainerDetail[K]) => {
    setDraftDetail((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updatePhotoSection = (
    sectionId: string,
    updater: (section: ContainerPhotoSection) => ContainerPhotoSection
  ) => {
    setDraftDetail((prev) =>
      prev
        ? {
            ...prev,
            photoSections: prev.photoSections.map((section) =>
              section.id === sectionId ? updater(section) : section
            ),
          }
        : prev
    );
  };

  // Remover imagem
  const handleRemoveImage = (sectionId: string, index: number) => {
    if (!isEditing) return;
    updatePhotoSection(sectionId, (section) => ({
      ...section,
      images: section.images.filter((_, idx) => idx !== index),
    }));
  };

  // Selecionar imagem
  const pickImage = async (source: "library" | "camera"): Promise<string | undefined> => {
    try {
      const permission =
        source === "library"
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : await ImagePicker.requestCameraPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          source === "library"
            ? "Precisamos de acesso à sua galeria para anexar imagens."
            : "Precisamos de acesso à câmera para registrar novas imagens."
        );
        return undefined;
      }

      const pickerResult =
        source === "library"
          ? await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: false,
              quality: 0.7,
            })
          : await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              cameraType: ImagePicker.CameraType.back,
            });

      if (!pickerResult.canceled && pickerResult.assets?.length) {
        return pickerResult.assets[0]?.uri;
      }
    } catch (err) {
      console.error("Erro ao selecionar imagem:", err);
      Alert.alert("Erro ao anexar", "Não foi possível captar a imagem. Tente novamente.");
    }
    return undefined;
  };

  // Anexar imagem a uma seção
  const handleAttachImage = async (sectionId: string, source: "library" | "camera") => {
    if (!isEditing || !draftDetail) return;
    const uri = await pickImage(source);
    if (!uri) return;

    updatePhotoSection(sectionId, (section) => ({
      ...section,
      images: [...section.images, uri],
    }));
  };

  // Prompt para escolher origem da imagem
  const promptImageSource = (message: string, onSelect: (source: "library" | "camera") => void) => {
    Alert.alert(message, "Selecione a origem da imagem", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => onSelect("library") },
      { text: "Câmera", onPress: () => onSelect("camera") },
    ]);
  };

  // Cancelar edição
  const handleEditCancel = () => {
    if (isCreateMode) {
      router.back();
      return;
    }
    setDraftDetail(undefined);
    setIsEditing(false);
  };

  // Verificar se é URI local
  const isLocalUri = (uri: string): boolean => {
    return uri.startsWith("file://") || uri.startsWith("content://");
  };

  // Salvar edição
  const handleEditSave = async () => {
    if (!draftDetail || !containerId || saving) return;

    setSaving(true);

    try {
      // Diferença entre imagens originais (API) e atuais (salvar)
      const removedImagesByCategory = draftDetail.photoSections.reduce<
        Record<string, { urls: string[]; ids: string[]; urlToId: Record<string, string> }>
      >(
        (acc, section) => {
          const sectionConfig = CATEGORY_SECTIONS.find((c) => c.id === section.id);
          if (!sectionConfig) return acc;

          const original = originalImages[section.id] ?? [];
          const currentRemote = section.images.filter((uri) => !isLocalUri(uri));
          const removed = original.filter((url) => !currentRemote.includes(url));
          if (removed.length) {
            const idMap = imageIdMap[section.id] ?? {};
            const ids = removed
              .map((url) => idMap[url])
              .filter((id): id is string => typeof id === "string" && id.length > 0);
            acc[sectionConfig.apiCategory] = { urls: removed, ids, urlToId: idMap };
          }
          return acc;
        },
        {}
      );

      // 1. Atualizar dados do container
      const payload = {
        description: draftDetail.description?.trim() ?? "",
        sacksCount: Number(draftDetail.sacariaQuantity) || 0,
        tareTons: Number(draftDetail.tare) || 0,
        liquidWeight: Number(draftDetail.netWeight) || 0,
        grossWeight: Number(draftDetail.grossWeight) || 0,
        agencySeal: draftDetail.sealAgency?.trim() ?? "",
        otherSeals:
          draftDetail.otherSeals
            ?.split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0) ?? [],
        status: mapStatusToApi(draftDetail.status ?? "Aberto"),
      };

      console.log("📤 Atualizando container:", payload);

      const updateResponse = await authFetch(
        `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Erro ao atualizar container:", errorText);
        Alert.alert("Erro", `Não foi possível salvar o container. ${errorText}`);
        return;
      }

      // 2. Remover imagens apagadas
      const deletionResults = await Promise.all(
        Object.entries(removedImagesByCategory).map(([apiCategory, images]) =>
          deleteImagesByCategory(containerId, apiCategory, images)
        )
      );

      if (deletionResults.some((ok) => !ok)) {
        Alert.alert("Aviso", "Algumas imagens não puderam ser excluídas. Tente novamente.");
      }

      // 2. Upload de novas imagens (locais)
      const form = new FormData();
      let hasNewImages = false;

      draftDetail.photoSections.forEach((section) => {
        const sectionConfig = CATEGORY_SECTIONS.find((c) => c.id === section.id);
        if (!sectionConfig) return;

        const localImages = section.images.filter((uri) => isLocalUri(uri));

        localImages.forEach((uri, idx) => {
          const filename = `${sectionConfig.uploadField}_${idx}_${Date.now()}.jpg`;
          form.append(sectionConfig.uploadField, {
            uri,
            name: filename,
            type: "image/jpeg",
          } as any);
          hasNewImages = true;
        });
      });

      if (hasNewImages) {
        console.log("📤 Enviando novas imagens...");

        const uploadResponse = await authFetch(
          `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}/images`,
          {
            method: "POST",
            body: form,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.warn("Aviso: Falha ao enviar algumas imagens:", errorText);
          // Não interrompe o fluxo, apenas avisa
        } else {
          console.log("✅ Imagens enviadas com sucesso");
        }
      }

      // 3. Recarregar dados atualizados
      await fetchContainerDetail(containerId);

      Alert.alert("Sucesso", hasNewImages ? "Container e imagens atualizados." : "Container atualizado.");
    } catch (err) {
      console.error("Erro ao salvar container:", err);
      Alert.alert("Erro", "Não foi possível salvar o container.");
    } finally {
      setSaving(false);
    }
  };

  // Excluir container
  const handleDeletePress = () => {
    if (isCreateMode || !displayDetail || !containerId) return;

    Alert.alert(
      "Excluir container",
      `Tem certeza que deseja excluir o container "${displayDetail.code}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: handleConfirmDelete,
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!containerId || deleting) return;

    setDeleting(true);

    try {
      console.log("🗑️ Excluindo container:", containerId);

      const response = await authFetch(
        `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}`,
        { method: "DELETE" }
      );

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error("Erro ao excluir container:", errorText);
        Alert.alert("Erro", "Não foi possível excluir o container.");
        return;
      }

      console.log("✅ Container excluído com sucesso");
      Alert.alert("Sucesso", "Container excluído com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Erro ao excluir container:", err);
      Alert.alert("Erro", "Não foi possível excluir o container.");
    } finally {
      setDeleting(false);
    }
  };

  // Finalizar container (mudar status para COMPLETED)
  const handleCompleteContainer = () => {
    if (!containerId || isContainerCompleted) return;

    Alert.alert(
      "Finalizar container",
      "Tem certeza que deseja finalizar este container?\n\nApós finalizado, não será possível editar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: handleConfirmComplete,
        },
      ]
    );
  };

  const handleConfirmComplete = async () => {
    if (!containerId || saving) return;

    setSaving(true);

    try {
      console.log("✅ Finalizando container:", containerId);

      const response = await authFetch(
        `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}/status`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao finalizar container:", errorText);
        Alert.alert("Erro", `Não foi possível finalizar o container.\n${errorText}`);
        return;
      }

      await fetchContainerDetail(containerId);
      Alert.alert("Sucesso", "Container finalizado com sucesso.");
    } catch (err) {
      console.error("Erro ao finalizar container:", err);
      Alert.alert("Erro", "Não foi possível finalizar o container.");
    } finally {
      setSaving(false);
    }
  };

  // Renderização de estados de loading/erro
  if (!displayDetail) {
    if (isCreateMode) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
          <CustomStatusBar backgroundColor="#F6F8FB" barStyle="dark-content" translucent />
          <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" color="#49C5B6" />
            <Text style={{ marginTop: 12, color: "#2A2E40" }}>Preparando criação do container...</Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
        <CustomStatusBar backgroundColor="#F6F8FB" barStyle="dark-content" translucent />
        <View className="flex-1 items-center justify-center px-6">
          {loading ? (
            <>
              <ActivityIndicator size="large" color="#49C5B6" />
              <Text style={{ marginTop: 12, color: "#2A2E40" }}>Carregando container...</Text>
            </>
          ) : (
            <>
              <Text style={styles.missingTitle}>{error || "Container não encontrado"}</Text>
              <Text style={[styles.missingSubtitle, { textAlign: "center", marginTop: 8 }]}>
                Verifique se o identificador informado está correto ou selecione outro container.
              </Text>
            </>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { marginTop: 24 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonLabel, styles.cancelButtonText]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Campos de informação
  const infoFields: InfoField[] = [
    {
      key: "code",
      label: "Identificação",
      value: isEditing ? draftDetail?.code ?? "" : displayDetail.code ?? "-",
      editable: false, // ID não é editável
      placeholder: "Identificador",
    },
    {
      key: "description",
      label: "Descrição",
      value: isEditing ? draftDetail?.description ?? "" : displayDetail.description ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("description", value) : undefined,
      placeholder: "Descrição do container",
    },
    {
      key: "sacariaQuantity",
      label: "Quantidade de Sacas",
      value: isEditing ? draftDetail?.sacariaQuantity ?? "" : displayDetail.sacariaQuantity ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("sacariaQuantity", value) : undefined,
      placeholder: "Ex: 300",
      keyboardType: "numeric",
    },
    {
      key: "tare",
      label: "Tara (ton)",
      value: isEditing ? draftDetail?.tare ?? "" : displayDetail.tare ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("tare", value) : undefined,
      placeholder: "Ex: 2.5",
      keyboardType: "numeric",
    },
    {
      key: "netWeight",
      label: "Peso Líquido (ton)",
      value: isEditing ? draftDetail?.netWeight ?? "" : displayDetail.netWeight ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("netWeight", value) : undefined,
      placeholder: "Ex: 25.0",
      keyboardType: "numeric",
    },
    {
      key: "grossWeight",
      label: "Peso Bruto (ton)",
      value: isEditing ? draftDetail?.grossWeight ?? "" : displayDetail.grossWeight ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("grossWeight", value) : undefined,
      placeholder: "Ex: 27.5",
      keyboardType: "numeric",
    },
    {
      key: "sealAgency",
      label: "Lacre Principal (agência)",
      value: isEditing ? draftDetail?.sealAgency ?? "" : displayDetail.sealAgency ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("sealAgency", value) : undefined,
      placeholder: "Código do lacre",
    },
    {
      key: "otherSeals",
      label: "Outros Lacres",
      value: isEditing ? draftDetail?.otherSeals ?? "" : displayDetail.otherSeals ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("otherSeals", value) : undefined,
      placeholder: "Ex: LAC1002, LAC1003",
    },
  ];

  const leftColumnKeys: Array<InfoField["key"]> = ["code", "tare", "sealAgency", "otherSeals"];
  const columns = [
    infoFields.filter((field) => leftColumnKeys.includes(field.key)),
    infoFields.filter((field) => !leftColumnKeys.includes(field.key)),
  ];

  const headerPaddingTop = Math.max(insets.top, 12) + 12;
  const slideWidth = Math.max((SCREEN_WIDTH - CAROUSEL_ITEM_SPACING) / 1.5, 220);
  const snapInterval = slideWidth + CAROUSEL_ITEM_SPACING;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
      <CustomStatusBar backgroundColor="#F6F8FB" barStyle="dark-content" translucent />
      <View className="flex-1">
        {/* Header */}
        <View
          className="w-full px-6 pb-4"
          style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                className="p-2"
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
                  {displayDetail?.code || "Container"}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Operação {displayDetail?.operationCode || "-"}
                </Text>
              </View>
            </View>
            <View style={[styles.statusChip, { backgroundColor: statusInfo.background }]}>
              <Text style={[styles.statusChipText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Botões de ação */}
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, saving && styles.buttonDisabled]}
                  onPress={handleEditCancel}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  <Text style={[styles.actionButtonLabel, styles.cancelButtonText]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton, saving && styles.buttonDisabled]}
                  onPress={handleEditSave}
                  activeOpacity={0.85}
                  disabled={saving}
                >
                  {saving ? (
                    <View style={styles.savingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.actionButtonLabel, styles.editButtonText, { marginLeft: 8 }]}>
                        Salvando...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.actionButtonLabel, styles.editButtonText]}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!isContainerCompleted && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={handleEditPress}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionButtonLabel, styles.editButtonText]}>Editar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton, deleting && styles.buttonDisabled]}
                  onPress={handleDeletePress}
                  activeOpacity={0.8}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#B91C1C" />
                  ) : (
                    <Text style={[styles.actionButtonLabel, styles.deleteButtonText]}>Excluir</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Conteúdo */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Card de dados do container */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Dados do Container</Text>
              {!isEditing && (
                <View style={styles.switchWrapper}>
                  <Switch
                    trackColor={{ false: "#CBD5E1", true: "#49C5B6" }}
                    thumbColor="#FFFFFF"
                    value={!!isContainerCompleted}
                    onValueChange={handleCompleteToggle}
                    disabled={isContainerCompleted || saving}
                  />
                  <Text style={styles.switchLabel}>Completo</Text>
                </View>
              )}
            </View>

            {/* Seletor de status (modo edição) */}
            {isEditing && (
              <View style={styles.statusEditor}>
                <Text style={styles.editLabel}>Status do container</Text>
                <View style={styles.statusOptions}>
                  {STATUS_OPTIONS.map((status) => {
                    const isActive = draftDetail?.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusOption, isActive && styles.statusOptionActive]}
                        onPress={() => updateDraft("status", status)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[styles.statusOptionText, isActive && styles.statusOptionTextActive]}
                        >
                          {STATUS_MAP[status].label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Grid de informações */}
            <View style={styles.infoGrid}>
              {columns.map((columnFields, columnIndex) => (
                <View key={`column-${columnIndex}`} style={styles.infoGridColumn}>
                  {columnFields.map((field) => (
                    <InfoColumn
                      key={field.key}
                      label={field.label}
                      value={field.value}
                      editable={field.editable}
                      onChange={field.onChange}
                      placeholder={field.placeholder}
                      keyboardType={field.keyboardType}
                      containerStyle={styles.infoGridField}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Seções de fotos */}
          {displayDetail.photoSections.map((section) => {
            const count = section.images.length;
            return (
              <View key={section.id} style={styles.carouselCard}>
                <View style={styles.carouselHeader}>
                  <Text style={styles.carouselTitle}>{section.title}</Text>
                  {!isEditing && (
                    <Text style={styles.carouselCount}>
                      {count} {count === 1 ? "imagem" : "imagens"}
                    </Text>
                  )}
                </View>

                {isEditing ? (
                  <View style={styles.imageEditor}>
                    {section.images.length > 0 ? (
                      section.images.map((image, index) => (
                        <View key={`${section.id}-image-${index}`} style={styles.imageRow}>
                          <Image
                            source={{ uri: image }}
                            style={styles.imageThumbnail}
                            resizeMode="cover"
                          />
                          <View style={styles.imageInfo}>
                            <Text style={styles.imageLabel} numberOfLines={1}>
                              {isLocalUri(image) ? "Nova imagem" : `Imagem ${index + 1}`}
                            </Text>
                            {isLocalUri(image) && (
                              <Text style={styles.imagePending}>Pendente de upload</Text>
                            )}
                          </View>
                          <View style={styles.imageActions}>
                            <TouchableOpacity
                              style={[styles.imageActionButton, styles.imageActionDanger]}
                              onPress={() => handleRemoveImage(section.id, index)}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.imageActionDangerText}>Remover</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.imageEmptyText}>Nenhuma imagem anexada ainda.</Text>
                    )}
                    <View style={styles.imageFooterActions}>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={() =>
                          promptImageSource("Adicionar imagem", (source) =>
                            handleAttachImage(section.id, source)
                          )
                        }
                        activeOpacity={0.85}
                      >
                        <Text style={styles.imageActionText}>Adicionar imagem</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : count > 0 ? (
                  <FlatList
                    data={section.images}
                    keyExtractor={(item, index) => `${section.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={snapInterval}
                    contentContainerStyle={[
                      styles.carouselContent,
                      { paddingHorizontal: CAROUSEL_ITEM_SPACING },
                    ]}
                    ItemSeparatorComponent={() => <View style={{ width: CAROUSEL_ITEM_SPACING }} />}
                    renderItem={({ item }) => (
                      <View style={[styles.carouselSlide, { width: slideWidth }]}>
                        <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.carouselEmpty}>
                    <Text style={styles.carouselEmptyTitle}>Sem imagens</Text>
                    <Text style={styles.carouselEmptySubtitle}>
                      {isContainerCompleted
                        ? "Nenhuma imagem registrada para esta etapa."
                        : "Clique em Editar para adicionar imagens."}
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

// Componente de campo de informação
const InfoColumn = ({
  label,
  value,
  editable = false,
  onChange,
  placeholder,
  keyboardType = "default",
  containerStyle,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  containerStyle?: StyleProp<ViewStyle>;
}) => {
  const displayValue = value && value.length > 0 ? value : "-";
  return (
    <View style={[styles.infoField, containerStyle]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {editable && onChange ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={styles.infoInput}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.infoValue} numberOfLines={2}>
          {displayValue}
        </Text>
      )}
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
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconButton: {
    borderRadius: 9999,
    backgroundColor: "rgba(73, 197, 182, 0.12)",
  },
  titleWrapper: {
    flex: 1,
    gap: 4,
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
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    flexWrap: "wrap",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#49C5B6",
  },
  completeButton: {
    backgroundColor: "#22C55E",
  },
  completeButtonText: {
    color: "#FFFFFF",
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
  cancelButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)",
  },
  cancelButtonText: {
    color: "#334155",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
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
  statusEditor: {
    gap: 12,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
  },
  statusOptionActive: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#34D399",
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  statusOptionTextActive: {
    color: "#047857",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoGridColumn: {
    flex: 0,
    width: "48%",
  },
  infoGridField: {
    marginBottom: 16,
  },
  infoField: {
    width: "100%",
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
  infoInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.45)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#F8FAFC",
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
    height: 180,
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
    textAlign: "center",
    paddingHorizontal: 20,
  },
  imageEditor: {
    gap: 14,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  imageThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  imageInfo: {
    flex: 1,
    gap: 2,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A2E40",
  },
  imagePending: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "500",
  },
  imageActions: {
    flexDirection: "row",
    gap: 8,
  },
  imageActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: "rgba(73, 197, 182, 0.14)",
  },
  imageActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F766E",
  },
  imageActionDanger: {
    backgroundColor: "rgba(248, 113, 113, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.45)",
  },
  imageActionDangerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  imageEmptyText: {
    fontSize: 13,
    color: "#64748B",
    fontStyle: "italic",
  },
  imageFooterActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2E40",
  },
  missingSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
});

export default ContainerDetails;
