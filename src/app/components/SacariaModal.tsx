import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import type { OperationCargoDetail } from '../types/operation';
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
  onSave?: (updatedCargo: OperationCargoDetail) => void | Promise<void>;
  isOperationClosed?: boolean;
}

const CloseIcon = ({ size = 22, color = '#2A2E40' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M6 6L18 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// Gerar hash simples da string para ID estável
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Gerar ID único baseado na URI (estável para mesma URI)
const generateStableId = (uri: string): string => {
  // Para URLs do S3, extrair a key do arquivo
  if (uri.includes('s3.amazonaws.com') || uri.includes('s3.')) {
    const match = uri.match(/\/([^/?]+)\?/) || uri.match(/\/([^/]+)$/);
    if (match) {
      return `s3-${hashString(match[1])}`;
    }
  }
  // Para URIs locais, usar apenas hash da URI (sem Date.now() para estabilidade)
  return `local-${hashString(uri)}`;
};

// Verificar se é uma URL do S3
const isS3Url = (uri: string): boolean => {
  return uri.includes('s3.amazonaws.com') || uri.includes('s3.');
};

const SacariaModal: React.FC<SacariaModalProps> = ({
  visible,
  onClose,
  cargo,
  onSave,
  isOperationClosed = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Imagens do cargo original (somente leitura quando não está editando)
  const originalImages = useMemo(() => {
    if (!cargo?.images) return [];
    const seen = new Set<string>();
    return cargo.images
      .filter((uri) => uri && uri.trim().length > 0)
      .filter((uri) => {
        const key = uri.trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [cargo?.images]);

  // Reset quando modal abre/fecha
  useEffect(() => {
    if (visible) {
      setEditingImages([...originalImages]);
      setFailedImages([]);
    } else {
      setEditingImages([]);
      setFailedImages([]);
      setIsEditing(false);
      setIsSaving(false);
    }
  }, [visible, originalImages]);

  // Fechar edição se operação for fechada
  useEffect(() => {
    if (isOperationClosed && isEditing) {
      setIsEditing(false);
    }
  }, [isOperationClosed, isEditing]);

  // Imagens a exibir
  const displayImages = (isEditing ? editingImages : originalImages).filter(
    (uri) => !failedImages.includes(uri),
  );
  const imageCount = displayImages.length;

  const carouselWidth = Dimensions.get('window').width;
  const slideWidth = Math.max((carouselWidth - CAROUSEL_ITEM_SPACING) / 1.5, 220);

  // Adicionar nova imagem
  const handleAddImage = useCallback((uri: string) => {
    const trimmedUri = uri.trim();
    if (!trimmedUri) return;

    setEditingImages((prev) => {
      // Verificar duplicata
      if (prev.includes(trimmedUri)) {
        console.log('⚠️ Imagem duplicada ignorada');
        return prev;
      }
      console.log('✅ Adicionando imagem:', trimmedUri.substring(0, 50));
      return [...prev, trimmedUri];
    });
  }, []);

  // Remover imagem por URI (não por índice!)
  const handleRemoveImage = useCallback((uriToRemove: string) => {
    console.log('🗑️ Removendo imagem:', uriToRemove.substring(0, 50));
    setEditingImages((prev) => prev.filter((uri) => uri !== uriToRemove));
  }, []);

  // Selecionar imagem do dispositivo
  const handleSelectImage = async (source: 'library' | 'camera') => {
    if (isPickingImage || isSaving) return;

    try {
      setIsPickingImage(true);

      const permission =
        source === 'library'
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : await ImagePicker.requestCameraPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          source === 'library'
            ? 'Precisamos de acesso à sua galeria para anexar imagens.'
            : 'Precisamos de acesso à câmera para registrar novas imagens.'
        );
        return;
      }

      const result =
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

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleAddImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível anexar a imagem.');
    } finally {
      setIsPickingImage(false);
    }
  };

  // Iniciar edição
  const handleBeginEdit = () => {
    if (!cargo || isOperationClosed || isSaving) return;
    setEditingImages([...originalImages]);
    setIsEditing(true);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    if (isSaving) return;
    setEditingImages([...originalImages]);
    setIsEditing(false);
  };

  // Fechar modal com limpeza de estado
  const handleClose = () => {
    if (isSaving) return;
    setEditingImages([]);
    setIsEditing(false);
    onClose();
  };

  // Salvar edição (com suporte a async)
  const handleSaveEdit = async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);

    try {
      // Remover duplicatas mantendo a ordem
      const uniqueImages = editingImages.filter(
        (uri, index, self) => uri.trim().length > 0 && self.indexOf(uri) === index
      );

      console.log('💾 Salvando', uniqueImages.length, 'imagens');

      await onSave({
        title: cargo?.title ?? 'Sacaria',
        description: cargo?.description ?? 'Imagens da sacaria desta operação',
        images: uniqueImages,
        notes: cargo?.notes,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar imagens:', error);
      Alert.alert('Erro', 'Não foi possível salvar as imagens. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = Boolean(onSave) && !isOperationClosed;

  // Tratar falha de carregamento (remove da lista atual e marca como falha)
  const handleImageError = useCallback((uri: string) => {
    setFailedImages((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
    setEditingImages((prev) => prev.filter((item) => item !== uri));
  }, []);

  // Renderizar imagem individual no editor
  const renderEditorImage = (uri: string) => {
    const imageKey = `edit-${generateStableId(uri)}`;
    const index = editingImages.indexOf(uri);

    return (
      <View key={imageKey} style={styles.imageCard}>
        <View style={styles.imagePreview}>
          <Image
            source={{ uri, cache: isS3Url(uri) ? 'reload' : 'default' }}
            style={styles.imageThumbnail}
            resizeMode="cover"
            onError={() => handleImageError(uri)}
          />
        </View>
        <View style={styles.imageMeta}>
          <Text style={styles.imageLabel}>Imagem {index + 1}</Text>
          <TouchableOpacity
            onPress={() => handleRemoveImage(uri)}
            style={[styles.removeImageButton, isSaving && styles.buttonDisabled]}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Text style={[styles.removeImageText, isSaving && styles.textDisabled]}>
              Remover
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar carrossel de visualização
  const renderCarousel = () => {
    if (displayImages.length === 0) {
      return (
        <View style={styles.carouselEmpty}>
          <Text style={styles.carouselEmptyTitle}>Sem imagens</Text>
          <Text style={styles.carouselEmptySubtitle}>
            {isOperationClosed
              ? 'Esta operação está fechada e não possui imagens.'
              : 'Clique em Editar para adicionar imagens.'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth + CAROUSEL_ITEM_SPACING}
        decelerationRate="fast"
        contentContainerStyle={[styles.carouselContent, { paddingHorizontal: CAROUSEL_ITEM_SPACING }]}
      >
        {displayImages.map((uri, index) => {
          const imageKey = `carousel-${generateStableId(uri)}`;
          return (
            <View
              key={imageKey}
              style={[
                styles.carouselSlide,
                { width: slideWidth, marginRight: index < displayImages.length - 1 ? CAROUSEL_ITEM_SPACING : 0 },
              ]}
            >
              <Image
                source={{ uri, cache: isS3Url(uri) ? 'reload' : 'default' }}
                style={styles.carouselImage}
                resizeMode="cover"
                onError={() => handleImageError(uri)}
              />
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{cargo?.title ?? 'Sacaria'}</Text>
              <Text style={styles.subtitle}>
                {imageCount} {imageCount === 1 ? 'imagem' : 'imagens'}
                {isOperationClosed && <Text style={styles.closedBadge}> • Fechada</Text>}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {canEdit &&
                (isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.headerButton, styles.cancelButton, isSaving && styles.buttonDisabled]}
                      activeOpacity={0.75}
                      disabled={isSaving}
                    >
                      <Text style={[styles.headerButtonText, styles.cancelButtonText, isSaving && styles.textDisabled]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      style={[styles.headerButton, styles.saveButton, isSaving && styles.saveButtonSaving]}
                      activeOpacity={0.75}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <View style={styles.savingContainer}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={[styles.headerButtonText, styles.saveButtonText, { marginLeft: 8 }]}>
                            Salvando...
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.headerButtonText, styles.saveButtonText]}>Salvar</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={handleBeginEdit}
                    style={[styles.headerButton, styles.editButton]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.headerButtonText, styles.editButtonText]}>Editar</Text>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.closeButton, isSaving && styles.buttonDisabled]}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <CloseIcon color={isSaving ? '#9CA3AF' : '#2A2E40'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {isEditing ? (
              <View style={styles.imageEditorSection}>
                <Text style={styles.imageEditorTitle}>Imagens da sacaria</Text>

                {/* Toolbar */}
                <View style={styles.imageToolbar}>
                  <TouchableOpacity
                    onPress={() => handleSelectImage('library')}
                    style={[styles.toolbarButton, (isPickingImage || isSaving) && styles.toolbarButtonDisabled]}
                    activeOpacity={0.75}
                    disabled={isPickingImage || isSaving}
                  >
                    <Text style={[styles.toolbarButtonText, (isPickingImage || isSaving) && styles.toolbarButtonTextDisabled]}>
                      Anexar do dispositivo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSelectImage('camera')}
                    style={[styles.toolbarButton, (isPickingImage || isSaving) && styles.toolbarButtonDisabled]}
                    activeOpacity={0.75}
                    disabled={isPickingImage || isSaving}
                  >
                    <Text style={[styles.toolbarButtonText, (isPickingImage || isSaving) && styles.toolbarButtonTextDisabled]}>
                      Tirar foto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Lista de imagens */}
                <View style={styles.imageEditorList}>
                  {editingImages.length > 0 ? (
                    editingImages.map((uri) => renderEditorImage(uri))
                  ) : (
                    <View style={styles.editorEmpty}>
                      <Text style={styles.editorEmptyTitle}>Nenhuma imagem adicionada</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              renderCarousel()
            )}
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
  closedBadge: {
    color: '#B91C1C',
    fontWeight: '600',
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
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonSaving: {
    backgroundColor: '#3BA89A',
    minWidth: 120,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  content: {
    paddingBottom: 24,
  },
  imageEditorSection: {
    gap: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(42, 46, 64, 0.06)',
  },
  imageEditorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E40',
  },
  imageEditorList: {
    gap: 12,
  },
  imageToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2E40',
  },
  removeImageButton: {
    alignSelf: 'flex-end',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    backgroundColor: '#F8FAFC',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  editorEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
});

export default SacariaModal;
