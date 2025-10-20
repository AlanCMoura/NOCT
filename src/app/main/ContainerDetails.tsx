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
  TextInput,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { cssInterop } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import CustomStatusBar from "../components/StatusBar";
import {
  findContainerDetail,
  type ContainerDetail,
  type ContainerStatus,
  type ContainerPhotoSection,
  createContainerDetail,
  createEmptyPhotoSections,
} from "../mocks/mockContainerDetails";
import * as ImagePicker from "expo-image-picker";

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

const STATUS_OPTIONS: ContainerStatus[] = [
  "Nao iniciado",
  "Em andamento",
  "Concluido",
];

const buildEmptyContainer = (
  overrides?: Partial<ContainerDetail>,
): ContainerDetail => {
  const base: ContainerDetail = {
    id: "",
    code: "",
    operationCode: "",
    operationName: "",
    status: "Nao iniciado",
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
    photoSections: overrides.photoSections?.length
      ? overrides.photoSections
      : base.photoSections,
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
    } catch (error) {
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

  const detail = useMemo(() => {
    if (!containerId) return undefined;
    return findContainerDetail(containerId);
  }, [containerId]);

  const [currentDetail, setCurrentDetail] = useState<ContainerDetail | undefined>(detail);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDetail, setDraftDetail] = useState<ContainerDetail | undefined>();

  useEffect(() => {
    if (!detail) return;
    setCurrentDetail(detail);
    if (!isCreateMode) {
      setIsEditing(false);
      setDraftDetail(undefined);
    }
  }, [detail, isCreateMode]);

  useEffect(() => {
    if (!isCreateMode || currentDetail) return;
    const overrides: Partial<ContainerDetail> = {
      operationCode: operationCodeParam ?? "",
      operationName: operationNameParam ?? "",
    };
    setCurrentDetail(undefined);
    setDraftDetail((prev) => prev ?? buildEmptyContainer(overrides));
    setIsEditing(true);
  }, [isCreateMode, operationCodeParam, operationNameParam, currentDetail]);

  const baseDetail = currentDetail ?? detail;
  const displayDetail = isEditing && draftDetail ? draftDetail : baseDetail;
  const isDetailInProgress = displayDetail?.status === "Em andamento";

  const handleToggleProgress = () => {
    if (!displayDetail) return;
    const nextStatus: ContainerStatus =
      displayDetail.status === "Em andamento" ? "Nao iniciado" : "Em andamento";
    if (isEditing && draftDetail) {
      setDraftDetail({ ...draftDetail, status: nextStatus });
      return;
    }
    if (!baseDetail) return;
    setCurrentDetail({ ...displayDetail, status: nextStatus });
  };

  const handleEditPress = () => {
    if (!baseDetail) return;
    setDraftDetail({ ...baseDetail });
    setIsEditing(true);
  };

  const updateDraft = <K extends keyof ContainerDetail>(
    key: K,
    value: ContainerDetail[K],
  ) => {
    setDraftDetail((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updatePhotoSection = (
    sectionId: string,
    updater: (section: ContainerPhotoSection) => ContainerPhotoSection,
  ) => {
    setDraftDetail((prev) =>
      prev
        ? {
            ...prev,
            photoSections: prev.photoSections.map((section) =>
              section.id === sectionId ? updater(section) : section,
            ),
          }
        : prev,
    );
  };

  const handleRemoveImage = (sectionId: string, index: number) => {
    if (!isEditing) return;
    updatePhotoSection(sectionId, (section) => ({
      ...section,
      images: section.images.filter((_, idx) => idx !== index),
    }));
  };

  const pickImage = async (source: "library" | "camera") => {
    try {
      const permission =
        source === "library"
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : await ImagePicker.requestCameraPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permissao necessaria",
          source === "library"
            ? "Precisamos de acesso a sua galeria para anexar imagens."
            : "Precisamos de acesso a camera para registrar novas imagens.",
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
        const uri = pickerResult.assets[0]?.uri;
        return uri ?? undefined;
      }
    } catch (error) {
      Alert.alert(
        "Erro ao anexar",
        "Nao foi possivel captar a imagem. Tente novamente.",
      );
    }
    return undefined;
  };

  const handleAttachImage = async (sectionId: string, source: "library" | "camera") => {
    if (!isEditing || !draftDetail) return;
    const uri = await pickImage(source);
    if (!uri) return;
    updatePhotoSection(sectionId, (section) => ({
      ...section,
      images: [...section.images, uri],
    }));
  };

  const promptImageSource = (
    message: string,
    onSelect: (source: "library" | "camera") => void,
  ) => {
    Alert.alert(message, "Selecione a origem da imagem", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => onSelect("library") },
      { text: "Camera", onPress: () => onSelect("camera") },
    ]);
  };

  const handleEditCancel = () => {
    if (isCreateMode) {
      setDraftDetail(buildEmptyContainer());
      setIsEditing(true);
      router.back();
      return;
    }
    setDraftDetail(undefined);
    setIsEditing(false);
  };

  const sanitizeDetail = (detailToSanitize: ContainerDetail): ContainerDetail => {
    const sanitizeText = (text?: string) => (text ?? "").trim();
    const sanitizedSections = (detailToSanitize.photoSections ?? []).map(
      (section) => {
        const sanitizedTitle = sanitizeText(section.title) || section.title;
        const sanitizedImages = (section.images ?? [])
          .map((image) => image.trim())
          .filter(
            (image, idx, arr) => image.length > 0 && arr.indexOf(image) === idx,
          );
        return {
          ...section,
          title: sanitizedTitle,
          images: sanitizedImages,
        };
      },
    );

    return {
      ...detailToSanitize,
      id: sanitizeText(detailToSanitize.id),
      code: sanitizeText(detailToSanitize.code),
      operationCode: sanitizeText(detailToSanitize.operationCode),
      operationName: sanitizeText(detailToSanitize.operationName),
      sacariaQuantity: sanitizeText(detailToSanitize.sacariaQuantity),
      tare: sanitizeText(detailToSanitize.tare),
      netWeight: sanitizeText(detailToSanitize.netWeight),
      grossWeight: sanitizeText(detailToSanitize.grossWeight),
      sealAgency: sanitizeText(detailToSanitize.sealAgency),
      otherSeals: sanitizeText(detailToSanitize.otherSeals),
      pickupDate: sanitizeText(detailToSanitize.pickupDate),
      stuffingDate: sanitizeText(detailToSanitize.stuffingDate),
      photoSections: sanitizedSections,
    };
  };

  const handleEditSave = () => {
    if (!draftDetail) return;
    const sanitized = sanitizeDetail(draftDetail);
    const normalized: ContainerDetail = {
      ...sanitized,
      id: sanitized.id || baseDetail?.id || "",
      code: sanitized.code || sanitized.id || baseDetail?.code || "",
      status: sanitized.status ?? "Nao iniciado",
      photoSections: sanitized.photoSections.length
        ? sanitized.photoSections
        : createEmptyPhotoSections(),
    };
    const savedDetail = createContainerDetail(normalized);
    setCurrentDetail(savedDetail);
    setDraftDetail(undefined);
    setIsEditing(false);
    if (isCreateMode || !baseDetail) {
      router.replace({
        pathname: "/main/ContainerDetails",
        params: { id: encodeURIComponent(savedDetail.id) },
      });
      Alert.alert("Container criado", "As informacoes foram salvas localmente.");
      return;
    }
    Alert.alert("Container atualizado", "As informacoes foram salvas localmente.");
  };

  const handleDeletePress = () => {
    if (isCreateMode || !displayDetail) return;
    Alert.alert(
      "Excluir container",
      "Esta acao nao pode ser desfeita. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive" },
      ],
    );
  };

  if (!displayDetail) {
    if (isCreateMode) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
          <CustomStatusBar
            backgroundColor="#F6F8FB"
            barStyle="dark-content"
            translucent
          />
          <View className="flex-1 items-center justify-center px-6">
            <Text style={styles.missingTitle}>Preparando criacao do container</Text>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#F6F8FB" }}>
        <CustomStatusBar
          backgroundColor="#F6F8FB"
          barStyle="dark-content"
          translucent
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={styles.missingTitle}>Container nao encontrado</Text>
          <Text style={[styles.missingSubtitle, { textAlign: "center" }]}>
            Verifique se o identificador informado esta correto ou selecione outro container.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

const infoFields = [
  {
    key: "code",
    label: "Container",
    value: isEditing ? draftDetail?.code ?? "" : displayDetail.code ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("code", value) : undefined,
      placeholder: "Identificador",
    },
    {
      key: "sacariaQuantity",
      label: "Quantidade de Sacaria",
      value: isEditing
        ? draftDetail?.sacariaQuantity ?? ""
        : displayDetail.sacariaQuantity ?? "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("sacariaQuantity", value)
        : undefined,
      placeholder: "Ex: 540 sacas",
    },
    {
      key: "tare",
      label: "Tara",
      value: isEditing ? draftDetail?.tare ?? "" : displayDetail.tare ?? "-",
      editable: isEditing,
      onChange: isEditing ? (value: string) => updateDraft("tare", value) : undefined,
      placeholder: "Ex: 2.220 kg",
    },
    {
      key: "netWeight",
      label: "Peso Liquido",
      value: isEditing
        ? draftDetail?.netWeight ?? ""
        : displayDetail.netWeight ?? "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("netWeight", value)
        : undefined,
      placeholder: "Ex: 27.000 kg",
    },
    {
      key: "grossWeight",
      label: "Peso Bruto",
      value: isEditing
        ? draftDetail?.grossWeight ?? ""
        : displayDetail.grossWeight ?? "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("grossWeight", value)
        : undefined,
      placeholder: "Ex: 27.081 kg",
    },
    {
      key: "sealAgency",
      label: "Lacre Agencia",
      value: isEditing
        ? draftDetail?.sealAgency ?? ""
        : displayDetail.sealAgency ?? "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("sealAgency", value)
        : undefined,
      placeholder: "Codigo do lacre",
    },
    {
      key: "otherSeals",
      label: "Lacres Outros",
      value: isEditing
        ? draftDetail?.otherSeals ?? ""
        : displayDetail.otherSeals ?? "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("otherSeals", value)
        : undefined,
      placeholder: "Observacoes",
    },
    {
      key: "pickupDate",
      label: "Data Retirada Terminal",
      value: isEditing
        ? draftDetail?.pickupDate ?? ""
        : displayDetail.pickupDate
          ? formatDate(displayDetail.pickupDate)
          : "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("pickupDate", value)
        : undefined,
      placeholder: "AAAA-MM-DD",
    },
    {
      key: "stuffingDate",
      label: "Data de Estufagem",
      value: isEditing
        ? draftDetail?.stuffingDate ?? ""
        : displayDetail.stuffingDate
          ? formatDate(displayDetail.stuffingDate)
          : "-",
      editable: isEditing,
      onChange: isEditing
        ? (value: string) => updateDraft("stuffingDate", value)
        : undefined,
    placeholder: "AAAA-MM-DD",
    align: "center" as const,
  },
];

const leftColumnKeys = ["code", "sacariaQuantity", "tare", "netWeight", "grossWeight"];

const columns = [
  infoFields.filter((field) => leftColumnKeys.includes(field.key)),
  infoFields.filter((field) => !leftColumnKeys.includes(field.key)),
];

  const headerPaddingTop = Math.max(insets.top, 12) + 12;

  const slideWidth = Math.max(
    (SCREEN_WIDTH - CAROUSEL_ITEM_SPACING) / 1.5,
    220,
  );
  const snapInterval = slideWidth + CAROUSEL_ITEM_SPACING;

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
                  Operacao {displayDetail?.operationCode || "-"}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: STATUS_MAP[displayDetail.status].background },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: STATUS_MAP[displayDetail.status].color },
                ]}
              >
                {STATUS_MAP[displayDetail.status].label}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleEditCancel}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.actionButtonLabel, styles.cancelButtonText]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditSave}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionButtonLabel, styles.editButtonText]}>
                    Salvar
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditPress}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonLabel, styles.editButtonText]}>
                    Editar
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
                    Excluir
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
                  value={!!isDetailInProgress}
                  onValueChange={handleToggleProgress}
                />
                <Text style={styles.switchLabel}>Em andamento</Text>
              </View>
            </View>
            {isEditing && (
              <View style={styles.statusEditor}>
                <Text style={styles.editLabel}>Status do container</Text>
                <View style={styles.statusOptions}>
                  {STATUS_OPTIONS.map((status) => {
                    const isActive = displayDetail.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          isActive && styles.statusOptionActive,
                        ]}
                        onPress={() => updateDraft("status", status)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            isActive && styles.statusOptionTextActive,
                          ]}
                        >
                          {STATUS_MAP[status].label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            <View style={styles.infoGrid}>
              {columns.map((columnFields, columnIndex) => (
                <View key={`column-${columnIndex}`} style={styles.infoGridColumn}>
                  {columnFields.map((field) => {
                    const fieldStyle =
                      field.align === "center"
                        ? styles.infoGridFieldCentered
                        : styles.infoGridField;
                    return (
                      <InfoColumn
                        key={field.key}
                        label={field.label}
                        value={field.value}
                        editable={field.editable}
                        onChange={field.onChange}
                        placeholder={field.placeholder}
                        containerStyle={fieldStyle}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

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
                            source={{ uri: image || "https://placehold.co/160x110?text=Imagem" }}
                            style={styles.imageThumbnail}
                          />
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
                      <Text style={styles.imageEmptyText}>
                        Nenhuma imagem anexada ainda. Use os botoes abaixo para adicionar.
                      </Text>
                    )}
                    <View style={styles.imageFooterActions}>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={() =>
                          promptImageSource("Adicionar imagem", (source) =>
                            handleAttachImage(section.id, source),
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
                    ItemSeparatorComponent={() => (
                      <View style={{ width: CAROUSEL_ITEM_SPACING }} />
                    )}
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

const InfoColumn = ({
  label,
  value,
  editable = false,
  onChange,
  placeholder,
  containerStyle,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
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
    alignSelf: "center",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    minWidth: 120,
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
  cancelButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)",
  },
  cancelButtonText: {
    color: "#334155",
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
  missingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2E40",
  },
  missingSubtitle: {
    fontSize: 14,
    color: "#64748B",
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
  imageEditor: {
    gap: 14,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageThumbnail: {
    width: 90,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  imageActions: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  },
  imageFooterActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
});

export default ContainerDetails;
