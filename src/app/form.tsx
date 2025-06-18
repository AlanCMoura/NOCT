import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, TouchableWithoutFeedback, TextInput, StyleSheet, Alert, Image, Modal, FlatList, Dimensions } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

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
const imageSize = (width - 60) / 3; // 3 colunas com margens

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
  const cameraRef = useRef<CameraView>(null);

  // Solicitar permissões quando o componente for montado
  useEffect(() => {
    requestGalleryPermissions();
  }, []);

  const requestGalleryPermissions = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar a galeria de fotos.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImagesFromGallery = async (): Promise<void> => {
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
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar as imagens da galeria.');
      console.error('Erro ao selecionar imagens:', error);
    }
  };

  const openCamera = async (): Promise<void> => {
    if (!permission) {
      return;
    }

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

  const takePicture = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          setSelectedImages(prev => [...prev, photo.uri]);
          
          // Fechar a câmera primeiro, depois mostrar o alert
          setShowCamera(false);
          
          // Aguardar um pouco para garantir que a câmera fechou
          setTimeout(() => {
            Alert.alert(
              'Foto capturada!',
              `Foto ${selectedImages.length + 1} salva com sucesso.\n\nDeseja tirar mais fotos?`,
              [
                { 
                  text: 'Sim, continuar', 
                  style: 'default',
                  onPress: () => {
                    // Reabrir a câmera para continuar
                    setShowCamera(true);
                  }
                },
                { 
                  text: 'Não, finalizar', 
                  style: 'cancel',
                  onPress: () => {
                    // Manter a câmera fechada
                  }
                },
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

  const toggleCameraFacing = (): void => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const closeCamera = (): void => {
    setShowCamera(false);
  };

  const showImageOptions = (): void => {
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

  const removeImage = (index: number): void => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = (): void => {
    Alert.alert(
      'Remover todas as imagens',
      'Tem certeza que deseja remover todas as imagens?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => setSelectedImages([])
        },
      ]
    );
  };

  const handleChange = (key: keyof FormData, value: string): void => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = (): void => {
    // Validação básica
    if (!formData.container_id || !formData.description) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    // Lógica para enviar os dados
    console.log("Formulário enviado:", formData);
    console.log("Imagens selecionadas:", selectedImages);
    console.log("Quantidade de imagens:", selectedImages.length);
    
    // Aqui você pode implementar o envio para sua API
    Alert.alert('Sucesso', `Formulário enviado com sucesso!\n${selectedImages.length} imagem(ns) anexada(s).`);
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <View className="m-1 relative">
      <Image
        source={{ uri: item }}
        style={{ width: imageSize, height: imageSize }}
        className="rounded-lg"
      />
      {/* Botão para remover imagem individual */}
      <TouchableOpacity
        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
        onPress={() => removeImage(index)}
      >
        <Text className="text-white text-xs font-bold">✕</Text>
      </TouchableOpacity>
    </View>
  );

  // Modal da Câmera
  const CameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          className="flex-1"
          facing={facing}
        >
          {/* Header da câmera */}
          <View className="flex-row justify-between items-center p-4 pt-12 bg-black/30">
            <TouchableOpacity
              className="bg-white/20 p-3 rounded-full"
              onPress={closeCamera}
            >
              <Text className="text-white font-bold">✕</Text>
            </TouchableOpacity>

            {/* Contador de fotos */}
            <View className="bg-white/20 px-3 py-2 rounded-full">
              <Text className="text-white font-semibold">
                {selectedImages.length} foto(s)
              </Text>
            </View>
            
            <TouchableOpacity
              className="bg-white/20 p-3 rounded-full"
              onPress={toggleCameraFacing}
            >
              <Text className="text-white font-bold">🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Espaço flexível */}
          <View className="flex-1" />

          {/* Controles da câmera */}
          <View className="flex-row justify-center items-center p-8 bg-black/30">
            <TouchableOpacity
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
              onPress={takePicture}
            >
              <View className="w-16 h-16 bg-white rounded-full" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6 bg-white">
          <Text className="text-2xl font-bold mb-6">Formulário</Text>

          <Text className="self-start mb-1 font-semibold">ID do Container *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 w-full mb-4"
            placeholder="Digite o ID do container"
            value={formData.container_id}
            onChangeText={(text) => handleChange("container_id", text)}
          />

          <Text className="self-start mb-1 font-semibold">Descrição *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 w-full mb-4"
            placeholder="Digite uma descrição"
            value={formData.description}
            onChangeText={(text) => handleChange("description", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Seção de Imagens */}
          <View className="w-full mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-semibold">
                Imagens ({selectedImages.length})
              </Text>
              {selectedImages.length > 0 && (
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
                {/* Grid de imagens selecionadas */}
                <FlatList
                  data={selectedImages}
                  renderItem={renderImageItem}
                  numColumns={3}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  className="mb-4"
                  scrollEnabled={false}
                />
                
                {/* Botão para adicionar mais imagens */}
                <TouchableOpacity
                  className="border-2 border-dashed border-blue-300 rounded-lg p-4 items-center justify-center mb-2"
                  onPress={showImageOptions}
                >
                  <Text className="text-blue-500 text-center font-semibold">+ Adicionar mais imagens</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center"
                onPress={showImageOptions}
              >
                <Text className="text-gray-500 text-center mb-2 text-4xl">📷</Text>
                <Text className="text-gray-500 text-center">Toque para adicionar imagens</Text>
                <Text className="text-gray-400 text-sm text-center mt-1">Galeria ou Câmera</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className="bg-blue-600 px-8 py-3 rounded-lg w-full"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Enviar {selectedImages.length > 0 && `(${selectedImages.length} imagem${selectedImages.length > 1 ? 's' : ''})`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal da Câmera */}
      <CameraModal />
    </SafeAreaView>
  );
}