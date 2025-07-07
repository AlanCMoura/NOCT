import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated,
  TouchableWithoutFeedback, TextInput, Alert, Image, Modal, FlatList, Dimensions
} from 'react-native';
import { router } from 'expo-router'
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
  const cameraRef = useRef<CameraView>(null);

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
    // You could add validation logic here
    router.push('/logs');
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

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const closeCamera = () => setShowCamera(false);

  const showImageOptions = () => {
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
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
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
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    if (!formData.container_id || !formData.description) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    console.log("Formulário enviado:", formData);
    console.log("Imagens selecionadas:", selectedImages);
    Alert.alert('Sucesso', `Formulário enviado com sucesso!\n${selectedImages.length} imagem(ns) anexada(s).`);
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <View className="m-1 relative">
      <Image
        source={{ uri: item }}
        style={{ width: imageSize, height: imageSize }}
        className="rounded-lg"
      />
      <TouchableOpacity
        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
        onPress={() => removeImage(index)}
      >
        <Text className="text-white text-xs font-bold">✕</Text>
      </TouchableOpacity>
    </View>
  );

  const CameraModal = () => (
    <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} className="flex-1" facing={facing}>
          <View className="flex-row justify-between items-center p-4 pt-12 bg-black/30">
            <TouchableOpacity
              className="bg-white/20 p-3 rounded-full"
              onPress={closeCamera}
            >
              <Text className="text-white font-bold">✕</Text>
            </TouchableOpacity>

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

          <View className="flex-1" />

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
    <SafeAreaView className="flex-1 bg-gray-50 relative">
      {/* Fundo esmaecido escuro */}
      <View className="absolute inset-0 bg-gray-200/50 z-40" />

      {/* Card flutuante centralizado */}
      <View className="absolute inset-0 items-center justify-center z-50">
        <View className="w-[85%] bg-white rounded-2xl shadow-10xl elevation-20 px-6 py-6">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Text className="text-2xl font-bold mb-6">Nova operação</Text>

            <Text className="self-start font-medium text-gray-800 mb-2">ID do Container</Text>
            <TextInput
              className="bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 w-full mb-6"
              placeholder="Digite o ID do container"
              value={formData.container_id}
              onChangeText={(text) => handleChange("container_id", text)}
            />

            <Text className="self-start font-medium text-gray-800 mb-2">Descrição</Text>
            <TextInput
              className="bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 w-full mb-6"
              placeholder="Digite uma descrição"
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View className="w-full mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-semibold text-gray-800">Imagens ({selectedImages.length})</Text>
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
                    style={{ borderColor: '#5484dc' }}
                    onPress={showImageOptions}
                  >
                    <Text style={{ color: '#5484dc' }} className="text-center font-semibold">+ Adicionar mais imagens</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="border-2 border-dashed rounded-lg p-8 items-center justify-center"
                  style={{ borderColor: '#5484dc' }}
                  onPress={showImageOptions}
                >
                  <Text style={{ color: '#5484dc' }} className="text-center mb-2 text-4xl">📷</Text>
                  <Text style={{ color: '#5484dc' }} className="text-center">Toque para adicionar imagens</Text>
                  <Text className="text-gray-500 text-sm text-center mt-1">Galeria ou Câmera</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row justify-between space-x-4 mb-2">
              {/* Botão à esquerda */}
              <TouchableOpacity
                className="bg-gray-500 px-6 py-3 rounded-lg flex-1 items-center justify-center mr-2"
                onPress={handlelogs}
              >
                <Text className="text-white text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>

              {/* Botão à direita (Criar) */}
              <TouchableOpacity
                className="bg-indigo-600 px-6 py-3 rounded-lg flex-1 items-center justify-center ml-2"
                onPress={handleSubmit}
              >
                <Text className="text-white text-center font-semibold">
                  Criar {selectedImages.length > 0 && `(${selectedImages.length} imagem${selectedImages.length > 1 ? 's' : ''})`}
                </Text>
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