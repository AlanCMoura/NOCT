import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { cssInterop } from 'nativewind';
import { Svg, Path } from 'react-native-svg';

// Configuração do cssInterop para suporte ao Tailwind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(Modal, { className: 'style' });

// Tipos e interfaces
interface OperationItem {
  operacao: string;
  container: string;
  qtde_fotos: string;
  status?: string;
  data_entrada?: string;
  data_saida?: string;
  hora_entrada?: string;
  hora_saida?: string;
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

// Componente para status indicator
const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'concluído' || normalizedStatus === 'concluido') return 'bg-green-500';
    if (normalizedStatus === 'em andamento') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <View className="flex-row items-center mt-1">
      <View className={`h-3 w-3 rounded-full ${getStatusColor(status)} mr-2`} />
      <Text className="text-lg font-semibold text-gray-800">{status}</Text>
    </View>
  );
};

// Componente para badge de disponibilidade de fotos
const PhotosBadge: React.FC<{ count: string }> = ({ count }) => {
  const photoCount = parseInt(count || '0');
  const isAvailable = photoCount > 0;
  
  return (
    <View className="flex-row items-center mt-1">
      <Text className="text-lg font-semibold text-gray-800">{count || '0'}</Text>
      <View className={`ml-2 px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
        <Text className={`text-xs ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
          {isAvailable ? 'Disponível' : 'Indisponível'}
        </Text>
      </View>
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

// Componente para card de data/hora
const DateTimeCard: React.FC<{ 
  title: string; 
  date: string; 
  time?: string; 
}> = ({ title, date, time }) => (
  <InfoCard title={title} value={date}>
    <Text className="text-base font-semibold text-gray-800 mt-1">{date}</Text>
    {time && <Text className="text-sm text-gray-500 mt-1">{time}</Text>}
  </InfoCard>
);

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
      data_entrada: 'Data de Entrada',
      data_saida: 'Data de Saída',
      hora_entrada: 'Hora de Entrada',
      hora_saida: 'Hora de Saída',
    };
    
    return fieldTitles[key] || key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Campos prioritários e adicionais
  const priorityFields = ['operacao', 'container', 'qtde_fotos', 'status', 'data_entrada', 'data_saida'];
  const additionalFields = Object.entries(item)
    .filter(([key, value]) => !priorityFields.includes(key) && !isEmpty(value))
    .sort(([a], [b]) => a.localeCompare(b));

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
            
            {/* Status */}
            {!isEmpty(item.status) && (
              <InfoCard title="Status" value="" className="mb-4 bg-gray-50 border-gray-100">
                <StatusIndicator status={item.status!} />
              </InfoCard>
            )}
            
            {/* Datas de entrada e saída */}
            {(!isEmpty(item.data_entrada) || !isEmpty(item.data_saida)) && (
              <View className="flex-row mb-4 space-x-2">
                {!isEmpty(item.data_entrada) && (
                  <View className="flex-1">
                    <DateTimeCard 
                      title="Data de Entrada" 
                      date={item.data_entrada!} 
                      time={item.hora_entrada} 
                    />
                  </View>
                )}
                
                {!isEmpty(item.data_saida) && (
                  <View className="flex-1">
                    <DateTimeCard 
                      title="Data de Saída" 
                      date={item.data_saida!} 
                      time={item.hora_saida} 
                    />
                  </View>
                )}
              </View>
            )}
            
            {/* Informações adicionais */}
            {additionalFields.length > 0 ? (
              <>
                <Text className="mb-3 text-base font-medium text-gray-700">
                  Informações Adicionais
                </Text>
                {additionalFields.map(([key, value]) => (
                  <View key={key} className="mb-3">
                    <InfoCard 
                      title={formatFieldTitle(key)} 
                      value={String(value)} 
                    />
                  </View>
                ))}
              </>
            ) : (
              <View className="my-4 p-6 bg-gray-50 rounded-lg border border-gray-100 items-center">
                <Text className="text-gray-500 text-center">
                  Não há informações adicionais disponíveis
                </Text>
              </View>
            )}
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
  }
});

export default ItemDetailModal;