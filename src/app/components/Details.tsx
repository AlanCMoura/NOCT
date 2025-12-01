// VERSÃO FINAL - Adicionando renderização infinita de imagens
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { cssInterop } from 'nativewind';
import { Svg, Path } from 'react-native-svg';
import { API_BASE_URL } from '../config/apiConfig';

// Configuração do cssInterop
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(Modal, { className: 'style' });

const { width } = Dimensions.get('window');
const imageWidth = (width - 80) / 3; // Calcula largura para 3 colunas com margem

// Componente para ícone de imagem placeholder
const ImageIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#6D7380" strokeWidth={1.5}>
    <Path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0-2-2z" />
    <Path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <Path d="M21 15l-5-5L5 21" />
  </Svg>
);

interface User {
  id: number;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  password: string;
  role: string;
  twoFactorEnabled: boolean;
}

interface Container {
  id: string;
  description: string;
  images: string[];
}

interface OperationItem {
  id: number;
  container: Container;
  user: User;
  createdAt: string;
  qtde_fotos: number;
  [key: string]: any;
}

interface ItemDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: OperationItem | null;
  imageFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ isVisible, onClose, item, imageFetch }) => {
  // Hooks sempre na mesma ordem
  const [presignedUrls, setPresignedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);



  // Função para buscar URLs presigned
  const fetchPresignedUrls = async () => {
    if (!item?.container?.id) {
      setError('Container ID não disponível');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Buscando URLs para container: ${item.container.id}`);
      const response = await imageFetch(`${API_BASE_URL}/containers/${item.container.id}/imagens`);
      
      if (response.ok) {
        const urls: string[] = await response.json();
        console.log(`${urls.length} URLs presigned obtidas!`);
        setPresignedUrls(urls);
      } else {
        const errorMsg = `Erro: ${response.status} ${response.statusText}`;
        console.error(`${errorMsg}`);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Erro:`, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // useEffect sempre executado
  useEffect(() => {
    if (isVisible && item?.container?.id) {
      console.log('🔄 [FINAL] Modal aberto, buscando imagens...');
      fetchPresignedUrls();
    } else {
      setPresignedUrls([]);
      setError(null);
      setLoading(false);
      setSelectedImageIndex(null);
    }
  }, [isVisible, item?.container?.id]);

  // Early return após todos os hooks
  if (!item) {
    return null;
  }

  // Handler para pressionar imagem
  const handleImagePress = (index: number) => {
    if (presignedUrls[index]) {
      console.log(`🖼️ [FINAL] Imagem ${index + 1} pressionada`);
      setSelectedImageIndex(index);
    }
  };

  // Handler para navegar entre imagens no modo fullscreen
  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < presignedUrls.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  // Função para organizar imagens em grid dinâmico
  const renderImageGrid = () => {
    if (presignedUrls.length === 0) {
      return (
        <View className="bg-gray-50 p-8 rounded-lg items-center">
          <ImageIcon />
          <Text className="text-center mt-2" style={{ color: '#6D7380' }}>
            Nenhuma imagem anexada
          </Text>
        </View>
      );
    }

    // Organiza todas as imagens em linhas de 3
    const rows = [];
    for (let i = 0; i < presignedUrls.length; i += 3) {
      rows.push(presignedUrls.slice(i, i + 3));
    }

    return (
      <View className="space-y-3">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row space-x-3">
            {row.map((url, colIndex) => {
              const imageIndex = rowIndex * 3 + colIndex;
              return (
                <View key={imageIndex} className="flex-1">
                  <TouchableOpacity 
                    className="bg-gray-100 border rounded-lg overflow-hidden"
                    style={{ 
                      height: imageWidth,
                      borderColor: '#E5E7EB',
                      elevation: 2,
                      shadowColor: '#2A2E40',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }}
                    onPress={() => handleImagePress(imageIndex)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onLoad={() => console.log(`✅Imagem ${imageIndex + 1} carregada com sucesso!`)}
                      onError={(error) => console.error(`❌rro imagem ${imageIndex + 1}:`, error.nativeEvent?.error)}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {/* Preenche espaços vazios na última linha */}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
              <View key={`empty-${emptyIndex}`} className="flex-1" />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(42, 46, 64, 0.5)' }}>
          <View className="bg-white w-11/12 h-5/6 rounded-xl">
            
            {/* Header */}
            <View className="py-4 px-5 rounded-t-xl flex-row justify-between items-center" style={{ backgroundColor: '#49C5B6' }}>
              <Text className="text-xl font-bold text-white">Detalhes da Operação</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Text className="text-white text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView className="flex-1 px-5 pt-4 pb-2" showsVerticalScrollIndicator={false}>
              
              {/* ID da Operação em destaque */}
              <View className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: '#F0F9F7', borderColor: '#49C5B6' }}>
                <Text className="text-sm" style={{ color: '#49C5B6' }}>ID da Operação</Text>
                <Text className="text-xl font-bold mt-1" style={{ color: '#2A2E40' }}>
                  OP-{item.id}
                </Text>
              </View>

              {/* Container e Fotos lado a lado */}
              <View className="flex-row mb-4 space-x-2">
                <View className="flex-1 p-4 rounded-lg border" style={{ borderColor: '#6D7380', backgroundColor: '#F8F9FA'}}>
                  <Text className="text-sm" style={{ color: '#6D7380' }}>Container ID</Text>
                  <Text className="text-lg font-semibold mt-1" style={{ color: '#2A2E40' }}>
                    {item.container?.id || 'N/A'}
                  </Text>
                </View>
                
                <View className="p-4 rounded-lg border ml-5" style={{ borderColor: '#6D7380', backgroundColor: '#F8F9FA' }}>
                  <Text className="text-sm text-center" style={{ color: '#6D7380' }}>Fotos</Text>
                  <Text className="text-lg font-semibold mt-1 text-center" style={{ color: '#2A2E40' }}>
                    {presignedUrls.length || item.qtde_fotos}
                  </Text>
                </View>
              </View>

              {/* DESCRIÇÃO DA OPERAÇÃO */}
              <View className="p-4 rounded-lg border mb-4" style={{ backgroundColor: '#F0F9F7', borderColor: '#49C5B6' }}>
                <Text className="text-sm font-medium" style={{ color: '#3DA89F' }}>Descrição da Operação</Text>
                <Text className="text-base mt-2 leading-5" style={{ color: '#2A2E40' }}>
                  {item.container?.description || 'Nenhuma descrição disponível'}
                </Text>
              </View>

              {/* Informações do Usuário */}
              <View className="p-4 rounded-lg border mb-4" style={{ backgroundColor: '#F8F9FA', borderColor: '#6D7380' }}>
                <Text className="text-sm font-medium mb-2" style={{ color: '#6D7380' }}>Preenchido por:</Text>
                <Text className="text-sm" style={{ color: '#2A2E40' }}>
                  Criado por: {item.user?.firstName || 'N/A'} {item.user?.lastName || ''}
                </Text>
                <Text className="text-sm" style={{ color: '#2A2E40' }}>
                  CPF: {item.user?.cpf || 'N/A'}
                </Text>
              </View>

              {/* Seção de Imagens INFINITAS */}
              <View className="mt-2 mb-4">
                <Text className="mb-4 text-base font-medium" style={{ color: '#2A2E40' }}>
                  Fotos da Operação ({presignedUrls.length})
                </Text>
                
                {loading ? (
                  <View className="flex-row items-center justify-center p-8 bg-gray-50 rounded-lg">
                    <ActivityIndicator size="small" color="#49C5B6" />
                    <Text className="ml-2" style={{ color: '#6D7380' }}>Carregando imagens...</Text>
                  </View>
                ) : error ? (
                  <View className="p-4 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: '#F87171' }}>
                    <Text className="text-sm font-medium" style={{ color: '#DC2626' }}>Erro ao carregar imagens:</Text>
                    <Text className="text-xs mt-1" style={{ color: '#EF4444' }}>{error}</Text>
                    <TouchableOpacity 
                      className="mt-3 p-2 rounded"
                      style={{ backgroundColor: '#FEE2E2' }}
                      onPress={fetchPresignedUrls}
                    >
                      <Text className="text-xs text-center" style={{ color: '#B91C1C' }}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  renderImageGrid()
                )}
              </View>
            </ScrollView>
            
            {/* Footer */}
            <TouchableOpacity 
              className="mx-5 mb-5 mt-3 py-4 rounded-lg items-center"
              style={{ backgroundColor: '#49C5B6' }}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Visualização de Imagem em Tela Cheia */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedImageIndex !== null}
        onRequestClose={closeImageViewer}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
          {/* Header do Visualizador */}
          <View className="flex-row justify-between items-center px-5 py-4 mt-8">
            <TouchableOpacity onPress={closeImageViewer} className="p-2">
              <Text className="text-white text-lg font-bold">✕</Text>
            </TouchableOpacity>
            
            {selectedImageIndex !== null && (
              <Text className="text-white font-medium">
                {selectedImageIndex + 1} de {presignedUrls.length}
              </Text>
            )}
            
            <View style={{ width: 40 }} />
          </View>

          {/* Imagem Central */}
          <View className="flex-1 justify-center items-center px-4">
            {selectedImageIndex !== null && presignedUrls[selectedImageIndex] && (
              <Image
                source={{ uri: presignedUrls[selectedImageIndex] }}
                style={{
                  width: width - 32,
                  height: '80%',
                }}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Controles de Navegação */}
          <View className="flex-row justify-between items-center px-8 pb-8">
            <TouchableOpacity
              onPress={handlePreviousImage}
              disabled={selectedImageIndex === 0}
              className="p-4"
              style={{
                opacity: selectedImageIndex === 0 ? 0.3 : 1,
              }}
            >
              <Text className="text-white text-2xl">‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeImageViewer}
              className="px-6 py-3 rounded-lg"
              style={{ backgroundColor: '#49C5B6' }}
            >
              <Text className="text-white font-medium">Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextImage}
              disabled={selectedImageIndex === presignedUrls.length - 1}
              className="p-4"
              style={{
                opacity: selectedImageIndex === presignedUrls.length - 1 ? 0.3 : 1,
              }}
            >
              <Text className="text-white text-2xl">›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ItemDetailModal;
