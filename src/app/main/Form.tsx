import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated,
  TouchableWithoutFeedback, TextInput, Alert, Image, Modal, FlatList, Dimensions, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router'
import { cssInterop } from 'nativewind';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, useAuthenticatedFetch } from '../contexts/_AuthContext';
import CustomStatusBar from '../components/StatusBar'; // Importando o componente CustomStatusBar
import { API_BASE_URL, API_ENABLED } from '../config/apiConfig';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
cssInterop(TouchableWithoutFeedback, { className: 'style' });
cssInterop(Image, { className: 'style' });
cssInterop(Modal, { className: 'style' });
cssInterop(FlatList, { className: 'style' });

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3;

interface FormData {
  container_id: string;
  description: string;
}

export default function Form() {
  const [formData, setFormData] = useState<FormData>({
    container_id: "",
    description: "",
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  // Hooks de autenticação
  const { isAuthenticated, user, token } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Verificação de autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para criar operações.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/')
          }
        ]
      );
    }
  }, [isAuthenticated]);

  useEffect(() => {
    requestGalleryPermissions();
  }, []);

  const requestGalleryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar a galeria de fotos.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImagesFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris]);
        console.log('📸 Imagens selecionadas da galeria:', imageUris.length);
      }
    } catch (error) {
      
      Alert.alert('Erro', 'Não foi possível selecionar as imagens da galeria.');
      console.error('Erro ao selecionar imagens:', error);
    }
  };

  const openCamera = async () => {
    if (!permission) return;

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar a câmera.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setShowCamera(true);
  };

  const handlelogs = () => {
    if (isSubmitting) return; // Impede navegação durante envio
    router.push('/main/Logs');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo) {
          setSelectedImages(prev => [...prev, photo.uri]);
          setShowCamera(false);
          console.log('📷 Foto capturada com sucesso');
          
          setTimeout(() => {
            Alert.alert(
              'Foto capturada!',
              `Foto ${selectedImages.length + 1} salva com sucesso.\n\nDeseja tirar mais fotos?`,
              [
                { text: 'Sim, continuar', onPress: () => setShowCamera(true) },
                { text: 'Não, finalizar', style: 'cancel' },
              ],
              { cancelable: false }
            );
          }, 300);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível tirar a foto.');
        console.error('Erro ao tirar foto:', error);
      }
    }
  };


  const closeCamera = () => setShowCamera(false);

  const showImageOptions = () => {
    if (isSubmitting) return; // Impede adicionar imagens durante envio
    
    Alert.alert(
      'Adicionar Imagens',
      'Escolha uma opção',
      [
        { text: 'Galeria', onPress: pickImagesFromGallery },
        { text: 'Câmera', onPress: openCamera },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const removeImage = (index: number) => {
    if (isSubmitting) return; // Impede remoção durante envio
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
    if (isSubmitting) return; // Impede remoção durante envio
    
    Alert.alert(
      'Remover todas as imagens',
      'Tem certeza que deseja remover todas as imagens?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => setSelectedImages([]) },
      ]
    );
  };

  const handleChange = (key: keyof FormData, value: string) => {
    if (isSubmitting) return; // Impede alteração durante envio
    setFormData({ ...formData, [key]: value });
  };

  // Mapeia status HTTP para mensagens de erro
  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 400:
        return 'Dados inválidos. Verifique os campos preenchidos.';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para criar operações.';
      case 409:
        return 'Container já existe ou conflito de dados.';
      case 500:
        return 'Erro interno do servidor. Tente novamente.';
      default:
        return 'Erro desconhecido. Tente novamente.';
    }
  };

  // Função principal para criar operação
  const handleSubmit = async () => {
    console.log('🚀 handleSubmit iniciado');
    
    // Validação básica
    if (!formData.container_id.trim() || !formData.description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    console.log('✅ Validação passou, iniciando submissão');
    setIsSubmitting(true);

    if (!API_ENABLED) {
      console.log('API desabilitada: simulando criacao de operacao');
      Alert.alert(
        'Sucesso',
        'API desabilitada. Operacao simulada com sucesso!',
        [
          {
            text: 'Ver Operacoes',
            onPress: () => {
              setFormData({ container_id: '', description: '' });
              setSelectedImages([]);
              router.push('/main/Logs');
            }
          },
          {
            text: 'Nova Operacao',
            onPress: () => {
              setFormData({ container_id: '', description: '' });
              setSelectedImages([]);
            }
          }
        ]
      );
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🔄 Criando operação...');
      console.log('👤 Usuário logado:', user?.cpf);
      console.log('📝 Dados da operação:', {
        containerId: formData.container_id.trim(),
        containerDescription: formData.description.trim(),
        imageCount: selectedImages.length
      });

      // Cria FormData para envio
      const formDataToSend = new FormData();
      
      // Adiciona campos obrigatórios (EXATAMENTE como o backend espera)
      formDataToSend.append('containerId', formData.container_id.trim());
      formDataToSend.append('containerDescription', formData.description.trim());
      
      console.log('📝 Campos adicionados ao FormData:', {
        containerId: formData.container_id.trim(),
        containerDescription: formData.description.trim()
      });
      
      // Adiciona imagens (se houver) - CORRIGIDO
      if (selectedImages.length > 0) {
        console.log(`📸 Processando ${selectedImages.length} imagens...`);
        
        for (let i = 0; i < selectedImages.length; i++) {
          const imageUri = selectedImages[i];
          console.log(`📷 Processando imagem ${i + 1}: ${imageUri.substring(0, 50)}...`);
          
          // Para React Native, usamos um objeto específico
          const imageFile = {
            uri: imageUri,
            type: 'image/jpeg',
            name: `image_${i + 1}.jpg`,
          };
          
          // IMPORTANTE: O backend espera 'images' (plural)
          formDataToSend.append('images', imageFile as any);
        }
        
        console.log(`✅ ${selectedImages.length} imagens adicionadas ao FormData`);
      } else {
        console.log('📸 Nenhuma imagem selecionada - criando operação apenas com texto');
      }

      console.log('📤 Enviando requisição para /operations');
      console.log('🔗 URL completa:', `${API_BASE_URL}/operations`);
      
      // DEBUG: Verificar token do contexto
      console.log('🔑 Token do contexto:', token ? `${token.substring(0, 30)}...` : 'NENHUM TOKEN');
      console.log('🔐 isAuthenticated:', isAuthenticated);
      console.log('👤 Usuário:', user?.cpf);

      // DEBUG: Log da estrutura do FormData
      console.log('📋 FormData keys:', Array.from(formDataToSend.keys()));
      
      console.log('📡 Fazendo requisição...');
      
      // Faz a requisição autenticada usando o AuthContext
      const response = await authenticatedFetch(`${API_BASE_URL}/operations`, {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        console.log('🎉 Resposta OK, processando JSON...');
        const operation = await response.json();
        console.log('✅ Operação criada com sucesso:', {
          id: operation.id,
          containerId: operation.containerId,
          imageCount: operation.containerImages?.length || 0
        });

        Alert.alert(
          'Sucesso',
          `Operação criada com sucesso!`,
          [
            {
              text: 'Ver Operações',
              onPress: () => {
                console.log('📍 Navegando para logs...');
                // Limpa o formulário antes de navegar
                setFormData({ container_id: '', description: '' });
                setSelectedImages([]);
                router.push('/main/Logs');
              }
            },
            {
              text: 'Nova Operação',
              onPress: () => {
                console.log('📍 Limpando formulário para nova operação...');
                // Limpa o formulário para nova operação
                setFormData({ container_id: '', description: '' });
                setSelectedImages([]);
              }
            }
          ]
        );

      } else {
        console.log('❌ Resposta com erro:', response.status);
        // Trata erros da API
        let errorDetails = '';
        try {
          const errorText = await response.text();
          errorDetails = errorText;
          console.log('📄 Erro detalhado do servidor:', errorText);
        } catch (e) {
          console.log('❌ Erro ao ler resposta de erro:', e);
        }

        const errorMessage = getErrorMessage(response.status);
        console.log('❌ Erro ao criar operação:', response.status, errorMessage);
        
        Alert.alert(
          'Erro da API',
          `Status: ${response.status}\n${errorMessage}${errorDetails ? `\n\nDetalhes: ${errorDetails}` : ''}`
        );
      }

    } catch (error) {
      console.error('❌ ERRO CAPTURADO:', error);
      
      // Log mais detalhado do erro
      if (error instanceof Error) {
        console.error('❌ Tipo do erro:', error.name);
        console.error('❌ Mensagem:', error.message);
        console.error('❌ Stack:', error.stack);
      }
      
      if (error instanceof Error && error.message === 'Sessão expirada') {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Você será redirecionado para o login.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/')
            }
          ]
        );
      } else if (error instanceof TypeError && error.message.includes('Network')) {
        Alert.alert(
          'Erro de Rede', 
          'Não foi possível conectar ao servidor.\n\nVerifique:\n• Conexão com a internet\n• Se o servidor está rodando\n• Se a URL está correta'
        );
      } else {
        Alert.alert(
          'Erro de Conexão', 
          `Falha na requisição.\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    } finally {
      console.log('🏁 Finalizando submissão, setIsSubmitting(false)');
      setIsSubmitting(false);
    }
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <View className="m-1 relative">
      <Image
        source={{ uri: item }}
        style={{ width: imageSize, height: imageSize }}
        className="rounded-lg"
      />
      <TouchableOpacity
        className={`absolute -top-2 -right-2 rounded-full w-6 h-6 items-center justify-center ${
          isSubmitting ? 'bg-gray-400' : 'bg-red-500'
        }`}
        onPress={() => removeImage(index)}
        disabled={isSubmitting}
      >
        <Text className="text-white text-xs font-bold">✕</Text>
      </TouchableOpacity>
    </View>
  );

  const CameraModal = () => (
    <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
          {/* Header da câmera */}
          <View className="flex-row justify-between items-center p-4 pt-12 bg-black/50">
            <TouchableOpacity
              className="bg-white/20 p-3 rounded-full"
              onPress={closeCamera}
            >
              <Text className="text-white font-bold text-lg">✕</Text>
            </TouchableOpacity>

            <View className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">
                {selectedImages.length} foto(s)
              </Text>
            </View>

          </View>

          {/* Área flexível para empurrar os controles para baixo */}
          <View style={{ flex: 1 }} />

          {/* Controles da câmera fixos na parte inferior */}
          <View className="bg-black/50 pb-8 pt-4">
            <View className="flex-row justify-center items-center">
              <TouchableOpacity
                className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
                onPress={takePicture}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <View className="w-16 h-16 bg-white rounded-full" />
              </TouchableOpacity>
            </View>
            
            {/* Instruções */}
            <Text className="text-white text-center mt-4 text-sm opacity-80">
              Toque no botão para tirar uma foto
            </Text>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  // Se não autenticado, não renderiza o formulário
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' }}>
        <CustomStatusBar 
          barStyle="light-content"
          backgroundColor="#6D7380"
          translucent={true}
        />
        <ActivityIndicator size="large" color="#49C5B6" />
        <Text className="text-gray-800 mt-4">Verificando autenticação...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA', position: 'relative' }}>
      {/* Usando o CustomStatusBar */}
      <CustomStatusBar 
        barStyle="light-content"
        backgroundColor="#6D7380"
        translucent={true}
      />

      {/* Card flutuante centralizado */}
      <View className="absolute inset-0 items-center justify-center z-50">
        <View className="w-[85%] bg-white rounded-3xl shadow-lg px-6 py-6">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Text className="text-xl font-bold text-gray-800 mb-5">Nova operação</Text>

            {/* Indicador do usuário logado */}
            <View className="bg-gray-200 px-3 py-2 rounded-lg mb-4">
              <Text className="text-gray-800 text-sm text-center">
                Criando como: {user?.cpf}
              </Text>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-2">ID do Container</Text>
            <TextInput
              className={`bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full mb-6 ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Digite o ID do container"
              placeholderTextColor="#A0AEC0"
              value={formData.container_id}
              onChangeText={(text) => handleChange("container_id", text)}
              editable={!isSubmitting}
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Descrição</Text>
            <TextInput
              className={`bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full mb-6 ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Digite uma descrição"
              placeholderTextColor="#A0AEC0"
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            <View className="w-full mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-medium text-gray-700">Imagens ({selectedImages.length})</Text>
                {selectedImages.length > 0 && !isSubmitting && (
                  <TouchableOpacity
                    className="bg-red-500 px-3 py-1 rounded"
                    onPress={removeAllImages}
                  >
                    <Text className="text-white text-sm">Remover todas</Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedImages.length > 0 ? (
                <View>
                  <FlatList
                    data={selectedImages}
                    renderItem={renderImageItem}
                    numColumns={3}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    className="mb-4"
                    scrollEnabled={false}
                  />
                  <TouchableOpacity
                    className="border-2 border-dashed rounded-lg p-4 items-center justify-center mb-2"
                    style={{ 
                      borderColor: isSubmitting ? '#ccc' : '#49C5B6',
                      opacity: isSubmitting ? 0.5 : 1 
                    }}
                    onPress={showImageOptions}
                    disabled={isSubmitting}
                  >
                    <Text 
                      style={{ color: isSubmitting ? '#ccc' : '#49C5B6' }} 
                      className="text-center font-semibold"
                    >
                      + Adicionar mais imagens
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="border-2 border-dashed rounded-lg p-8 items-center justify-center"
                  style={{ 
                    borderColor: isSubmitting ? '#ccc' : '#49C5B6',
                    opacity: isSubmitting ? 0.5 : 1 
                  }}
                  onPress={showImageOptions}
                  disabled={isSubmitting}
                >
                  <Text 
                    style={{ color: isSubmitting ? '#ccc' : '#49C5B6' }} 
                    className="text-center mb-2 text-4xl"
                  >
                    📷
                  </Text>
                  <Text 
                    style={{ color: isSubmitting ? '#ccc' : '#49C5B6' }} 
                    className="text-center"
                  >
                    Toque para adicionar imagens
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-1">Galeria ou Câmera</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row justify-between space-x-4 mb-2">
              {/* Botão Cancelar */}
              <TouchableOpacity
                className={`px-6 py-3 rounded-lg flex-1 items-center justify-center mr-2 ${
                  isSubmitting ? 'bg-gray-300' : 'bg-gray-500'
                }`}
                onPress={handlelogs}
                disabled={isSubmitting}
              >
                <Text className="text-white text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>

              {/* Botão Criar */}
              <TouchableOpacity
                className={`px-6 py-3 rounded-lg flex-1 items-center justify-center ml-2`}
                style={{ 
                  backgroundColor: isSubmitting ? '#6D7380' : '#49C5B6'
                }}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">Criando...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Criar {selectedImages.length > 0 && `(${selectedImages.length} imagem${selectedImages.length > 1 ? 's' : ''})`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal da câmera */}
      <CameraModal />
    </SafeAreaView>
  );
}