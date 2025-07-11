import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Image } from 'react-native';
import { cssInterop } from 'nativewind';
import { Svg, Path } from 'react-native-svg';

// Configuração do cssInterop para suporte ao Tailwind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(Modal, { className: 'style' });
cssInterop(Image, { className: 'style' });

// Tipos e interfaces
interface OperationItem {
  operacao: string;
  container: string;
  qtde_fotos: string;
  images?: string[]; // Array opcional de URLs das imagens
  [key: string]: any;
}

interface ItemDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: OperationItem | null;
}

// Componente para ícone de fechar
const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
    <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Componente para ícone de imagem placeholder
const ImageIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}>
    <Path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0-2-2z" />
    <Path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <Path d="M21 15l-5-5L5 21" />
  </Svg>
);

// Componente para badge de disponibilidade de fotos
const PhotosBadge: React.FC<{ count: string }> = ({ count }) => {
  const photoCount = parseInt(count || '0');
  
  return (
    <View className="flex-row items-center mt-1">
      <Text className="text-lg font-semibold text-gray-800">{count || '0'}</Text>
    </View>
  );
};

// Componente para card de informação
const InfoCard: React.FC<{ 
  title: string; 
  value: string; 
  className?: string;
  children?: React.ReactNode;
}> = ({ title, value, className = "bg-gray-50 border-gray-100", children }) => (
  <View className={`p-4 rounded-lg border ${className}`}>
    <Text className="text-sm text-gray-500">{title}</Text>
    {children || <Text className="text-lg font-semibold text-gray-800 mt-1">{value}</Text>}
  </View>
);

// Componente para slot de imagem
const ImageSlot: React.FC<{ 
  imageUrl?: string; 
  index: number; 
  onPress?: () => void;
}> = ({ imageUrl, index, onPress }) => (
  <TouchableOpacity 
    className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
    style={styles.imageSlot}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {imageUrl ? (
      <Image 
        source={{ uri: imageUrl }} 
        className="w-full h-full"
        style={styles.image}
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-full items-center justify-center bg-gray-50">
        <ImageIcon />
        <Text className="text-xs text-gray-400 mt-1">Foto {index + 1}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Componente principal do modal
const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ isVisible, onClose, item }) => {
  if (!item) return null;

  // Utilitários
  const isEmpty = (value: any): boolean => {
    return value === null || value === undefined || value === '' || 
           value === 'undefined' || String(value).trim() === '';
  };

  const formatFieldTitle = (key: string): string => {
    const fieldTitles: Record<string, string> = {
      operacao: 'Operação',
      qtde_fotos: 'Quantidade de Fotos',
    };
    
    return fieldTitles[key] || key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Campos prioritários e adicionais
  const priorityFields = ['operacao', 'container', 'qtde_fotos', 'images'];
  const additionalFields = Object.entries(item)
    .filter(([key, value]) => !priorityFields.includes(key) && !isEmpty(value))
    .sort(([a], [b]) => a.localeCompare(b));

  // Handler para pressionar imagem
  const handleImagePress = (index: number) => {
    // Aqui você pode implementar a lógica para abrir a imagem em tela cheia
    console.log(`Imagem ${index + 1} pressionada`);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-11/12 h-5/6 rounded-xl" style={styles.modalContainer}>
          
          {/* Header */}
          <View className="py-4 px-5 bg-indigo-500 rounded-t-xl flex-row justify-between items-center">
            <Text className="text-xl font-bold text-white">Detalhes da Operação</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <CloseIcon />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView className="flex-1 px-5 pt-4 pb-2" showsVerticalScrollIndicator={false}>
            
            {/* Operação em destaque */}
            <InfoCard 
              title="Operação" 
              value={isEmpty(item.operacao) ? 'Não informado' : item.operacao}
              className="mb-4 bg-indigo-50 border-indigo-100"
            >
              <Text className="text-xl font-bold text-indigo-900 mt-1">
                {isEmpty(item.operacao) ? 'Não informado' : item.operacao}
              </Text>
            </InfoCard>
            
            {/* Container e Fotos lado a lado */}
            <View className="flex-row mb-4 space-x-2">
              <View className="flex-1">
                <InfoCard 
                  title="Container" 
                  value={isEmpty(item.container) ? 'Não informado' : item.container} 
                />
              </View>
              
              <View className="flex-1">
                <InfoCard title="Fotos" value="">
                  <PhotosBadge count={item.qtde_fotos} />
                </InfoCard>
              </View>
            </View>

            {/* Seção de Imagens */}
            <View className="mt-6 mb-4">
              <Text className="mb-4 text-base font-medium text-gray-700">
                Fotos da Operação
              </Text>
              
              {/* Grid de imagens - 3 em cima, 2 embaixo */}
              <View className="space-y-3">
                {/* Primeira linha - 3 imagens */}
                <View className="flex-row space-x-3">
                  {[0, 1, 2].map((index) => (
                    <View key={index} className="flex-1">
                      <ImageSlot 
                        imageUrl={item.images?.[index]}
                        index={index}
                        onPress={() => handleImagePress(index)}
                      />
                    </View>
                  ))}
                </View>
                
                {/* Segunda linha - 2 imagens centralizadas */}
                <View className="flex-row space-x-3 justify-center">
                  {[3, 4].map((index) => (
                    <View key={index} style={styles.bottomImageContainer}>
                      <ImageSlot 
                        imageUrl={item.images?.[index]}
                        index={index}
                        onPress={() => handleImagePress(index)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Footer com botão de fechar */}
          <TouchableOpacity 
            className="mx-5 mb-5 mt-3 bg-indigo-500 py-4 rounded-lg items-center"
            onPress={onClose}
            style={styles.buttonShadow}
          >
            <Text className="text-white font-semibold text-base">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Estilos para sombras e elevação
const styles = StyleSheet.create({
  modalContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonShadow: {
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  imageSlot: {
    height: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    flex: 1,
  },
  bottomImageContainer: {
    width: '30%',
  },
});

export default ItemDetailModal;