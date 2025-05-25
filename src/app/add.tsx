import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { cssInterop } from 'nativewind';
import { useState, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Animated, 
  TouchableWithoutFeedback,
  Alert,
  Image
} from 'react-native';
import { router } from 'expo-router';

// Register components with NativeWind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
cssInterop(TouchableWithoutFeedback, { className: 'style' });
cssInterop(CameraView, { className: 'style' });
cssInterop(Image, { className: 'style' });

const handleform = () => {
    router.push('/form');
  };
export default function Add() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  // Verificar permissões da câmera
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center items-center">
        <View className="w-3/4 h-1/5 bg-white rounded-lg shadow-lg px-6 py-6 justify-center items-center">
          <Text className="text-center text-lg font-medium mb-4">Precisamos da sua permissão para acessar a câmera</Text>
          <TouchableOpacity 
            className="bg-indigo-600 py-3 px-6 rounded-lg shadow-md active:bg-indigo-600" 
            onPress={requestPermission}
          >
            <Text className="text-white font-bold text-base">Permitir Acesso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Verificar permissões da biblioteca de mídia
  if (mediaPermission && !mediaPermission.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <View className="w-3/4 h-1/5 bg-white rounded-lg shadow-lg px-6 py-6 justify-center items-center">
          <Text className="text-center text-lg font-medium mb-4">Precisamos da sua permissão para salvar fotos</Text>
          <TouchableOpacity 
            className="bg-indigo-600 py-3 px-6 rounded-lg shadow-md active:bg-indigo-600" 
            onPress={requestMediaPermission}
          >
            <Text className="text-white font-bold text-base">Permitir Acesso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current && !isTakingPicture) {
      try {
        setIsTakingPicture(true);
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedPhoto(photo.uri);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível tirar a foto");
        console.error(error);
      } finally {
        setIsTakingPicture(false);
      }
    }
  }

  async function savePhoto() {
    if (capturedPhoto) {
      try {
        // Salvar na galeria
        await MediaLibrary.saveToLibraryAsync(capturedPhoto);
        
        Alert.alert(
          "Sucesso!",
          "Foto salva na galeria",
          [{ text: "OK" }]
        );
        // Limpar a foto após salvar
        setCapturedPhoto(null);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível salvar a foto");
        console.error(error);
      }
    }
  }

  function discardPhoto() {
    // Simplesmente limpar a foto capturada e voltar para a câmera
    setCapturedPhoto(null);
  }

  // Se temos uma foto capturada, mostrar a tela de prévia
  if (capturedPhoto) {
    return (
      <View className="flex-1 bg-black">
        {/* Prévia da foto */}
        <Image 
          source={{ uri: capturedPhoto }} 
          className="flex-1" 
          resizeMode="contain"
        />
        
        {/* Barra de ações */}
        <View className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center py-8 px-4 bg-black/50">
          {/* Botão para descartar */}
          <TouchableOpacity 
            className="bg-red-500 px-6 py-3 rounded-full" 
            onPress={discardPhoto}
          >
            <Text className="text-white font-bold text-lg">Descartar</Text>
          </TouchableOpacity>
          
          {/* Botão para usar/salvar */}
          <TouchableOpacity 
            className="bg-green-500 px-8 py-3 rounded-full" 
            onPress={async () => {
              await savePhoto(); // salva na galeria
              router.push('/form'); // navega pra /form
            }}
          >
            <Text className="text-white font-bold text-lg">Usar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Tela da câmera (padrão)
  return (
    <View className="flex-1 justify-center">
      <CameraView 
        className="flex-1" 
        facing={facing}
        ref={cameraRef}
      >
        <View className="flex-1 items-center justify-end pb-16">
          {/* Botões de controle da câmera */}
          <View className="flex-row justify-around items-center w-full px-6">
            {/* Botão para alternar câmera */}
            <TouchableOpacity 
              className="bg-black/30 backdrop-blur-md p-4 rounded-full border border-white/30 active:bg-black/50" 
              onPress={toggleCameraFacing}
            >
              <Text className="text-white font-bold">Alternar</Text>
            </TouchableOpacity>
            
            {/* Botão para tirar foto */}
            <TouchableOpacity 
              className={`w-20 h-20 rounded-full border-4 border-white ${isTakingPicture ? 'bg-red-500' : 'bg-white/20'} justify-center items-center active:bg-white/40`}
              onPress={takePicture}
              disabled={isTakingPicture}
            >
              <View className="w-16 h-16 rounded-full bg-white" />
            </TouchableOpacity>
            
            {/* Espaçador para manter o botão de tirar foto centralizado */}
            <View className="w-16" />
          </View>
        </View>
      </CameraView>
    </View>
  );

}