import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import type { OperationCargoDetail } from '../mocks/mockOperationDetails';
import * as ImagePicker from 'expo-image-picker';

cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });

const CAROUSEL_ITEM_SPACING = 16;

interface SacariaModalProps {
  visible: boolean;
  onClose: () => void;
  cargo?: OperationCargoDetail;
  onSave?: (updatedCargo: OperationCargoDetail) => void;
}

const CloseIcon = ({ size = 22, color = '#2A2E40' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M6 6L18 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const SacariaModal: React.FC<SacariaModalProps> = ({
  visible,
  onClose,
  cargo,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCargo, setDraftCargo] = useState<OperationCargoDetail | undefined>(
    cargo
      ? {
          ...cargo,
          images: [...cargo.images],
        }
      : undefined,
  );
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    if (cargo) {
      setDraftCargo({
        ...cargo,
        images: [...cargo.images],
      });
    } else {
      setDraftCargo(undefined);
    }
    setIsEditing(false);
  }, [cargo, visible]);

  const displayCargo = isEditing ? draftCargo : cargo;
  const displayImages =
    displayCargo?.images?.filter((uri) => uri.trim().length > 0) ?? [];
  const imageCount = displayImages.length;
  const carouselWidth = Dimensions.get('window').width;
  const slideWidth = Math.max(
    (carouselWidth - CAROUSEL_ITEM_SPACING) / 1.5,
    220,
  );
  const carouselData = displayImages;

  useEffect(() => {
    if (!isEditing) return;
    setDraftCargo((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.filter((uri) => uri.trim().length > 0),
          }
        : prev,
    );
  }, [isEditing]);

  const commitImageUri = (uri: string) => {
    const normalized = uri.trim();
    if (!normalized) return;
    setDraftCargo((prev) => {
      if (!prev) return prev;
      const nextImages = [...prev.images];
      const alreadyExists = nextImages.some(
        (existing) => existing.trim() === normalized,
      );
      if (alreadyExists) return prev;
      const emptyIndex = nextImages.findIndex(
        (existing) => existing.trim().length === 0,
      );
      if (emptyIndex >= 0) {
        nextImages[emptyIndex] = normalized;
      } else {
        nextImages.push(normalized);
      }
      return { ...prev, images: nextImages };
    });
  };

  const handleChangeNotes = (value: string) => {
    setDraftCargo((prev) =>
      prev ? { ...prev, notes: value } : prev,
    );
  };

  const handleRemoveImage = (index: number) => {
    setDraftCargo((prev) => {
      if (!prev) return prev;
      const nextImages = prev.images.filter((_, idx) => idx !== index);
      return { ...prev, images: nextImages };
    });
  };

  const handleSelectImageFromDevice = async (
    source: 'library' | 'camera',
  ) => {
    if (!draftCargo) return;
    try {
      setIsPickingImage(true);
      const permission =
        source === 'library'
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : await ImagePicker.requestCameraPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permissao necessaria',
          source === 'library'
            ? 'Precisamos de acesso a sua galeria para anexar imagens.'
            : 'Precisamos de acesso a camera para registrar novas imagens.',
        );
        return;
      }

      const pickerResult =
        source === 'library'
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
        if (uri) {
          commitImageUri(uri);
        }
      }
    } catch (error) {
      Alert.alert(
        'Erro ao anexar',
        'Nao foi possivel anexar a imagem. Tente novamente.',
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleBeginEdit = () => {
    if (!cargo) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (cargo) {
      setDraftCargo({
        ...cargo,
        images: [...cargo.images],
      });
    } else {
      setDraftCargo(undefined);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!draftCargo || !onSave) {
      setIsEditing(false);
      return;
    }
    const sanitizedImages = draftCargo.images
      .map((uri) => uri.trim())
      .filter(
        (uri, index, array) =>
          uri.length > 0 && array.findIndex((item) => item === uri) === index,
      );
    const trimmedNotes = draftCargo.notes?.trim();
    const sanitizedCargo: OperationCargoDetail = {
      ...draftCargo,
      title: cargo?.title ?? 'Sacaria',
      notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
      images: sanitizedImages,
    };
    onSave(sanitizedCargo);
    setDraftCargo({
      ...sanitizedCargo,
      images: [...sanitizedCargo.images],
    });
    setIsEditing(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{displayCargo?.title ?? 'Sacaria'}</Text>
              <Text style={styles.subtitle}>
                {imageCount} {imageCount === 1 ? 'imagem' : 'imagens'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {onSave && (cargo || draftCargo) ? (
                isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.headerButton, styles.cancelButton]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.headerButtonText, styles.cancelButtonText]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      style={[styles.headerButton, styles.saveButton]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.headerButtonText, styles.saveButtonText]}>
                        Salvar
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={handleBeginEdit}
                    style={[styles.headerButton, styles.editButton]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.headerButtonText, styles.editButtonText]}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                )
              ) : null}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {isEditing && draftCargo ? (
              <View style={styles.imageEditorSection}>
                <Text style={styles.imageEditorTitle}>Imagens da sacaria</Text>
                <Text style={styles.helperText}>
                  Capture ou selecione novas imagens; os cards exibem a previa em tempo real.
                </Text>
                <View style={styles.imageToolbar}>
                  <TouchableOpacity
                    onPress={() => handleSelectImageFromDevice('library')}
                    style={[
                      styles.toolbarButton,
                      isPickingImage && styles.toolbarButtonDisabled,
                    ]}
                    activeOpacity={0.75}
                    disabled={isPickingImage}
                  >
                    <Text
                      style={[
                        styles.toolbarButtonText,
                        isPickingImage && styles.toolbarButtonTextDisabled,
                      ]}
                    >
                      Anexar do dispositivo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSelectImageFromDevice('camera')}
                    style={[
                      styles.toolbarButton,
                      isPickingImage && styles.toolbarButtonDisabled,
                    ]}
                    activeOpacity={0.75}
                    disabled={isPickingImage}
                  >
                    <Text
                      style={[
                        styles.toolbarButtonText,
                        isPickingImage && styles.toolbarButtonTextDisabled,
                      ]}
                    >
                      Tirar foto
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.imageEditorList}>
                  {draftCargo.images
                    .map((image, index) => ({ image, index }))
                    .filter(({ image }) => image.trim().length > 0)
                    .map(({ image, index }, visualIndex) => (
                      <View key={`image-card-${index}`} style={styles.imageCard}>
                        <View style={styles.imagePreview}>
                          <Image
                            source={{ uri: image }}
                            style={styles.imageThumbnail}
                          />
                        </View>
                        <View style={styles.imageMeta}>
                          <Text style={styles.imageLabel}>
                            Imagem {visualIndex + 1}
                          </Text>
                          <Text style={styles.imageMetaHint}>
                            Link oculto por seguranca. Remova ou substitua se necessario.
                          </Text>
                          <View style={styles.imageActions}>
                            <TouchableOpacity
                              onPress={() => handleRemoveImage(index)}
                              style={styles.removeImageButton}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.removeImageText}>Remover</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  {draftCargo.images.filter((uri) => uri.trim().length > 0).length === 0 ? (
                    <View style={styles.editorEmpty}>
                      <Text style={styles.editorEmptyTitle}>
                        Nenhuma imagem adicionada
                      </Text>
                      <Text style={styles.editorEmptySubtitle}>
                        Use os botoes acima para anexar imagens do dispositivo ou registrar novas fotos.
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : carouselData.length > 0 ? (
              <FlatList
                data={carouselData}
                horizontal
                keyExtractor={(item, index) => `${item}-${index}`}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={slideWidth + CAROUSEL_ITEM_SPACING}
                disableIntervalMomentum
                contentContainerStyle={[
                  styles.carouselContent,
                  { paddingHorizontal: CAROUSEL_ITEM_SPACING },
                ]}
                ItemSeparatorComponent={() => (
                  <View style={{ width: CAROUSEL_ITEM_SPACING }} />
                )}
                renderItem={({ item }) => (
                  <View style={[styles.carouselSlide, { width: slideWidth }]}>
                    <Image
                      source={{ uri: item }}
                      style={styles.carouselImage}
                    />
                  </View>
                )}
              />
            ) : (
              <View style={styles.carouselEmpty}>
                <Text style={styles.carouselEmptyTitle}>Sem previa ainda</Text>
                <Text style={styles.carouselEmptySubtitle}>
                  Adicione uma URL valida para ver a imagem aqui.
                </Text>
              </View>
            )}

            {isEditing && draftCargo ? (
              <View style={styles.formSection}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Notas</Text>
                  <TextInput
                    value={draftCargo.notes ?? ''}
                    onChangeText={handleChangeNotes}
                    style={[styles.textInput, styles.multilineInput]}
                    placeholder="Adicionar anotacoes"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ) : displayCargo?.notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Marcacao</Text>
                <Text style={styles.notesValue}>{displayCargo.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 46, 64, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E40',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6D7380',
  },
  closeButton: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(73, 197, 182, 0.12)',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#49C5B6',
  },
  editButtonText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(42, 46, 64, 0.08)',
  },
  cancelButtonText: {
    color: '#2A2E40',
  },
  saveButton: {
    backgroundColor: '#49C5B6',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  content: {
    paddingBottom: 24,
    gap: 20,
  },
  formSection: {
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2E40',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(42, 46, 64, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2A2E40',
    backgroundColor: '#F8FAFC',
  },
  multilineInput: {
    minHeight: 110,
  },
  helperText: {
    fontSize: 13,
    color: '#6D7380',
  },
  imageEditorSection: {
    gap: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(42, 46, 64, 0.06)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageEditorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E40',
  },
  imageEditorList: {
    gap: 12,
    marginTop: 12,
  },
  imageToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  toolbarButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(73, 197, 182, 0.18)',
  },
  toolbarButtonDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F766E',
  },
  toolbarButtonTextDisabled: {
    color: '#64748B',
  },
  imageCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.12)',
    marginTop: 12,
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  previewPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  imageMeta: {
    flex: 1,
    gap: 8,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2E40',
  },
  imageMetaHint: {
    fontSize: 12,
    color: '#64748B',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  removeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: 'rgba(185, 28, 28, 0.08)',
  },
  removeImageText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  editorEmpty: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    backgroundColor: '#F8FAFC',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  editorEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  editorEmptySubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  carouselContent: {
    paddingVertical: 12,
  },
  carouselSlide: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  carouselEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(42, 46, 64, 0.08)',
    backgroundColor: '#F8FAFC',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  carouselEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E40',
  },
  carouselEmptySubtitle: {
    fontSize: 14,
    color: '#6D7380',
    textAlign: 'center',
  },
  notesCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6D7380',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesValue: {
    fontSize: 15,
    color: '#2A2E40',
    fontWeight: '600',
  },
});

export default SacariaModal;

