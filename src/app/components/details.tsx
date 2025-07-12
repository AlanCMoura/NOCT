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

// Interface baseada nos campos reais da API
interface OperationItem {
  id: number;
  containerId: string;
  containerDescription: string;
  containerImages: string[];
  createdAt: string;
  userId: number;
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

// Componente para ícone de descrição
const DescriptionIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5}>
    <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </Svg>
);

// Componente para ícone de calendário
const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5}>
    <Path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
  </Svg>
);

// Componente para ícone de usuário
const UserIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5}>
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z" />
  </Svg>
);

// Componente para badge de disponibilidade de fotos
const PhotosBadge: React.FC<{ count: number }> = ({ count }) => {
  return (
    <View className="flex-row items-center mt-1">
      <Text className="text-lg font-semibold text-gray-800">{count}</Text>
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

// Componente para descrição expandida
const DescriptionCard: React.FC<{ description: string }> = ({ description }) => (
  <View className="p-4 rounded-lg border bg-amber-50 border-amber-200 mb-4">
    <View className="flex-row items-center mb-2">
      <DescriptionIcon />
      <Text className="text-sm text-amber-700 font-medium ml-2">Descrição da Operação</Text>
    </View>
    <Text className="text-gray-800 leading-5 text-base">
      {description}
    </Text>
  </View>
);

// Componente para informações do sistema
const SystemInfoCard: React.FC<{ 
  createdAt: string; 
  userId: number;
}> = ({ createdAt, userId }) => {
  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <View className="p-4 rounded-lg border bg-blue-50 border-blue-200 mb-4">
      <Text className="text-sm text-blue-700 font-medium mb-3">Informações do Sistema</Text>
      
      <View className="space-y-3">
        {/* Data de Criação */}
        <View className="flex-row items-center">
          <CalendarIcon />
          <Text className="text-blue-600 font-medium ml-2 mr-2">Criado em:</Text>
          <Text className="text-gray-800">{formatDate(createdAt)}</Text>
        </View>
        
        {/* ID do Usuário */}
        <View className="flex-row items-center">
          <UserIcon />
          <Text className="text-blue-600 font-medium ml-2 mr-2">Usuário ID:</Text>
          <Text className="text-gray-800">{userId}</Text>
        </View>
      </View>
    </View>
  );
};

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

  // Handler para pressionar imagem
  const handleImagePress = (index: number) => {
    console.log(`Imagem ${index + 1} pressionada - Operação ID: ${item.id}`);
    // Aqui você pode implementar a lógica para abrir a imagem em tela cheia
  };

  // Verificar se tem descrição válida
  const hasDescription = !isEmpty(item.containerDescription);

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
            
            {/* ID da Operação em destaque */}
            <InfoCard 
              title="ID da Operação" 
              value={`OP-${item.id}`}
              className="mb-4 bg-indigo-50 border-indigo-100"
            >
              <Text className="text-xl font-bold text-indigo-900 mt-1">
                OP-{item.id}
              </Text>
            </InfoCard>

            {/* Descrição da operação (se existir) */}
            {hasDescription && (
              <DescriptionCard description={item.containerDescription} />
            )}
            
            {/* Container e Fotos lado a lado */}
            <View className="flex-row mb-4 space-x-2">
              <View className="flex-1">
                <InfoCard 
                  title="Container ID" 
                  value={isEmpty(item.containerId) ? 'Não informado' : item.containerId} 
                />
              </View>
              
              <View className="flex-1">
                <InfoCard title="Fotos" value="">
                  <PhotosBadge count={item.containerImages?.length || 0} />
                </InfoCard>
              </View>
            </View>

            {/* Informações do Sistema */}
            <SystemInfoCard 
              createdAt={item.createdAt}
              userId={item.userId}
            />

            {/* Seção de Imagens */}
            <View className="mt-2 mb-4">
              <Text className="mb-4 text-base font-medium text-gray-700">
                Fotos da Operação ({item.containerImages?.length || 0})
              </Text>
              
              {item.containerImages && item.containerImages.length > 0 ? (
                <View className="space-y-3">
                  {/* Primeira linha - 3 imagens */}
                  <View className="flex-row space-x-3">
                    {[0, 1, 2].map((index) => (
                      <View key={index} className="flex-1">
                        <ImageSlot 
                          imageUrl={item.containerImages[index]}
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
                          imageUrl={item.containerImages[index]}
                          index={index}
                          onPress={() => handleImagePress(index)}
                        />
                      </View>
                    ))}
                  </View>
                  
                  {/* Indicador para mais imagens */}
                  {item.containerImages.length > 5 && (
                    <View className="mt-3">
                      <Text className="text-gray-500 text-center text-sm">
                        +{item.containerImages.length - 5} imagem{item.containerImages.length - 5 > 1 ? 's' : ''} adicional{item.containerImages.length - 5 > 1 ? 'is' : ''}
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