// src/components/OptimizedImageSlot.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';

// Configuração do cssInterop para suporte ao Tailwind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });

interface OptimizedImageSlotProps {
  presignedUrl: string;
  index: number;
  onPress?: () => void;
}

export const OptimizedImageSlot: React.FC<OptimizedImageSlotProps> = ({ 
  presignedUrl, 
  index, 
  onPress 
}) => {
  const [imageState, setImageState] = useState<'loading' | 'success' | 'error'>('loading');
  
  const handleImageLoad = () => {
    console.log(`✅ [Image ${index + 1}] Carregada via URL presigned`);
    setImageState('success');
  };
  
  const handleImageError = (error: any) => {
    console.error(`❌ [Image ${index + 1}] Erro ao carregar URL presigned:`, error.nativeEvent?.error);
    setImageState('error');
  };
  
  const handleRetry = () => {
    setImageState('loading');
  };
  
  return (
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
      onPress={imageState === 'success' && onPress ? onPress : undefined}
      activeOpacity={imageState === 'success' ? 0.7 : 1}
    >
      {imageState === 'loading' && (
        <View className="w-full h-full items-center justify-center">
          <ActivityIndicator size="small" color="#6366F1" />
          <Text className="text-xs text-gray-500 mt-2">Carregando...</Text>
        </View>
      )}
      
      {imageState === 'success' && (
        <Image 
          source={{ uri: presignedUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      
      {imageState === 'error' && (
        <TouchableOpacity 
          className="w-full h-full items-center justify-center bg-red-50"
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.5}>
            <Path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </Svg>
          <Text className="text-xs text-red-600 mt-1 text-center">Erro</Text>
          <Text className="text-xs text-red-400 text-center">Toque para tentar novamente</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function() { return null; }
