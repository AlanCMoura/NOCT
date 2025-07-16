// VERSÃO FINAL - Adicionando renderização de imagens
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Image } from 'react-native';
import { cssInterop } from 'nativewind';
import { Svg, Path } from 'react-native-svg';

// Configuração do cssInterop
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(Modal, { className: 'style' });

// Componente para ícone de imagem placeholder
const ImageIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}>
    <Path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0-2-2z" />
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

  console.log('🔍 [FINAL] Modal renderizando...', { 
    isVisible, 
    hasItem: !!item,
    itemId: item?.id || 'N/A'
  });

  // Função para buscar URLs presigned
  const fetchPresignedUrls = async () => {
    if (!item?.container?.id) {
      setError('Container ID não disponível');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`📸 [FINAL] Buscando URLs para container: ${item.container.id}`);
      
      const baseUrl = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';
      const response = await imageFetch(`${baseUrl}/containers/${item.container.id}/imagens`);
      
      if (response.ok) {
        const urls: string[] = await response.json();
        console.log(`✅ [FINAL] ${urls.length} URLs presigned obtidas!`);
        setPresignedUrls(urls);
      } else {
        const errorMsg = `Erro: ${response.status} ${response.statusText}`;
        console.error(`❌ [FINAL] ${errorMsg}`);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ [FINAL] Erro:`, err);
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
      // Aqui você pode implementar visualizador de imagem em tela cheia
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-11/12 h-5/6 rounded-xl">
          
          {/* Header */}
          <View className="py-4 px-5 bg-indigo-500 rounded-t-xl flex-row justify-between items-center">
            <Text className="text-xl font-bold text-white">Detalhes da Operação</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Text className="text-white text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView className="flex-1 px-5 pt-4 pb-2" showsVerticalScrollIndicator={false}>
            
            {/* ID da Operação em destaque */}
            <View className="mb-4 p-4 rounded-lg border bg-indigo-50 border-indigo-100">
              <Text className="text-sm text-indigo-500">ID da Operação</Text>
              <Text className="text-xl font-bold text-indigo-900 mt-1">
                OP-{item.id}
              </Text>
            </View>

            {/* Container e Fotos lado a lado */}
            <View className="flex-row mb-4 space-x-2">
              <View className="flex-1 p-4 rounded-lg border bg-gray-50 border-gray-100">
                <Text className="text-sm text-gray-500">Container ID</Text>
                <Text className="text-lg font-semibold text-gray-800 mt-1">
                  {item.container?.id || 'N/A'}
                </Text>
              </View>
              
              <View className="flex-1 p-4 rounded-lg border bg-gray-50 border-gray-100">
                <Text className="text-sm text-gray-500">Fotos</Text>
                <Text className="text-lg font-semibold text-gray-800 mt-1">
                  {item.qtde_fotos}
                </Text>
              </View>
            </View>

            {/* DESCRIÇÃO DA OPERAÇÃO - ADICIONADA */}
            <View className="p-4 rounded-lg border bg-green-50 border-green-100 mb-4">
              <Text className="text-sm text-green-700 font-medium">Descrição da Operação</Text>
              <Text className="text-base text-green-900 mt-2 leading-5">
                {item.container?.description || 'Nenhuma descrição disponível'}
              </Text>
            </View>

            {/* Informações do Usuário */}
            <View className="p-4 rounded-lg border bg-blue-50 border-blue-200 mb-4">
              <Text className="text-sm text-blue-700 font-medium mb-2">Preenchido por:</Text>
              <Text className="text-blue-600 text-sm">
                Criado por: {item.user?.firstName || 'N/A'} {item.user?.lastName || ''}
              </Text>
              <Text className="text-blue-600 text-sm">
                CPF: {item.user?.cpf || 'N/A'}
              </Text>
            </View>

            {/* Seção de Imagens REAL */}
            <View className="mt-2 mb-4">
              <Text className="mb-4 text-base font-medium text-gray-700">
                Fotos da Operação ({presignedUrls.length})
              </Text>
              
              {loading ? (
                <View className="flex-row items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text className="text-gray-600 ml-2">Carregando imagens...</Text>
                </View>
              ) : error ? (
                <View className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <Text className="text-red-600 text-sm font-medium">Erro ao carregar imagens:</Text>
                  <Text className="text-red-500 text-xs mt-1">{error}</Text>
                  <TouchableOpacity 
                    className="mt-3 p-2 bg-red-100 rounded"
                    onPress={fetchPresignedUrls}
                  >
                    <Text className="text-red-700 text-xs text-center">Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : presignedUrls.length > 0 ? (
                <View className="space-y-3">
                  {/* Primeira linha - 3 imagens */}
                  <View className="flex-row space-x-3">
                    {[0, 1, 2].map((index) => (
                      <View key={index} className="flex-1">
                        {presignedUrls[index] ? (
                          <TouchableOpacity 
                            className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
                            style={{ 
                              height: 100,
                              elevation: 2,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                            }}
                            onPress={() => handleImagePress(index)}
                            activeOpacity={0.7}
                          >
                            <Image 
                              source={{ uri: presignedUrls[index] }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                              onLoad={() => console.log(`✅ [FINAL] Imagem ${index + 1} carregada com sucesso!`)}
                              onError={(error) => console.error(`❌ [FINAL] Erro imagem ${index + 1}:`, error.nativeEvent?.error)}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View className="bg-gray-50 rounded-lg items-center justify-center" style={{ height: 100 }}>
                            <ImageIcon />
                            <Text className="text-xs text-gray-400 mt-1">Foto {index + 1}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  
                  {/* Segunda linha - 2 imagens centralizadas */}
                  {presignedUrls.length > 3 && (
                    <View className="flex-row space-x-3 justify-center">
                      {[3, 4].map((index) => (
                        presignedUrls[index] ? (
                          <View key={index} style={{ width: '30%' }}>
                            <TouchableOpacity 
                              className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
                              style={{ 
                                height: 100,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                              }}
                              onPress={() => handleImagePress(index)}
                              activeOpacity={0.7}
                            >
                              <Image 
                                source={{ uri: presignedUrls[index] }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                                onLoad={() => console.log(`✅ [FINAL] Imagem ${index + 1} carregada!`)}
                                onError={(error) => console.error(`❌ [FINAL] Erro imagem ${index + 1}:`, error.nativeEvent?.error)}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : null
                      ))}
                    </View>
                  )}
                  
                  {/* Indicador para mais imagens */}
                  {presignedUrls.length > 5 && (
                    <View className="mt-3">
                      <Text className="text-gray-500 text-center text-sm">
                        +{presignedUrls.length - 5} imagem{presignedUrls.length - 5 > 1 ? 's' : ''} adicional{presignedUrls.length - 5 > 1 ? 'is' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="bg-gray-50 p-8 rounded-lg items-center">
                  <ImageIcon />
                  <Text className="text-gray-500 text-center mt-2">
                    Nenhuma imagem anexada
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          {/* Footer */}
          <TouchableOpacity 
            className="mx-5 mb-5 mt-3 bg-indigo-500 py-4 rounded-lg items-center"
            onPress={onClose}
          >
            <Text className="text-white font-semibold text-base">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ItemDetailModal;