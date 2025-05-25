import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { cssInterop } from 'nativewind';
import { Svg, Path } from 'react-native-svg';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(Modal, { className: 'style' });

// Definindo interfaces para as props
interface ItemDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: {
    operacao: string;
    container: string;
    qtde_fotos: string;
    [key: string]: any;
  } | null;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ isVisible, onClose, item }) => {
  if (!item) return null;
  
  // Função para verificar se um valor está vazio
  const isEmpty = (value: any): boolean => {
    return value === null || value === undefined || value === '' || 
           value === 'undefined' || String(value).trim() === '';
  };
  
  // Função para formatar o título do campo
  const formatFieldTitle = (key: string): string => {
    const specialCases: {[key: string]: string} = {
      'operacao': 'Operação',
      'qtde_fotos': 'Quantidade de Fotos',
      'data_entrada': 'Data de Entrada',
      'data_saida': 'Data de Saída',
      'hora_entrada': 'Hora de Entrada',
      'hora_saida': 'Hora de Saída',
    };
    
    if (specialCases[key]) {
      return specialCases[key];
    }
    
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Ordenação dos campos para mostrar os mais importantes primeiro
  const priorityFields = ['operacao', 'container', 'qtde_fotos', 'status', 'data_entrada', 'data_saida'];
  
  // Obter todos os campos não vazios exceto os principais
  const additionalFields = Object.entries(item)
    .filter(([key, value]) => !priorityFields.includes(key) && !isEmpty(value))
    .sort((a, b) => a[0].localeCompare(b[0])); // Ordenação alfabética
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-11/12 max-h-5/6 rounded-xl shadow-lg" style={styles.modalContainer}>
          {/* Header com gradiente */}
          <View className="py-4 px-5 bg-indigo-500 rounded-t-xl flex-row justify-between items-center">
            <Text className="text-xl font-bold text-white">Detalhes da Operação</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1 px-5 pt-4 pb-2" showsVerticalScrollIndicator={false}>
            {/* Destaque para operação */}
            <View className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <Text className="text-sm text-indigo-600 font-medium">Operação</Text>
              <Text className="text-xl font-bold text-indigo-900 mt-1">
                {isEmpty(item.operacao) ? 'Não informado' : item.operacao}
              </Text>
            </View>
            
            {/* Container e fotos em destaque lado a lado */}
            <View className="flex-row mb-4 space-x-2">
              <View className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Text className="text-sm text-gray-500">Container</Text>
                <Text className="text-lg font-semibold text-gray-800 mt-1">
                  {isEmpty(item.container) ? 'Não informado' : item.container}
                </Text>
              </View>
              
              <View className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Text className="text-sm text-gray-500">Fotos</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {isEmpty(item.qtde_fotos) ? '0' : item.qtde_fotos}
                  </Text>
                  <View className={`ml-2 px-2 py-1 rounded-full ${parseInt(item.qtde_fotos || '0') > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={parseInt(item.qtde_fotos || '0') > 0 ? 'text-green-700 text-xs' : 'text-red-700 text-xs'}>
                      {parseInt(item.qtde_fotos || '0') > 0 ? 'Disponível' : 'Indisponível'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Status, se estiver disponível */}
            {!isEmpty(item.status) && (
              <View className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Text className="text-sm text-gray-500">Status</Text>
                <View className="flex-row items-center mt-1">
                  <View className={`h-3 w-3 rounded-full ${
                    item.status?.toLowerCase() === 'concluído' || item.status?.toLowerCase() === 'concluido' ? 
                    'bg-green-500' : item.status?.toLowerCase() === 'em andamento' ? 
                    'bg-yellow-500' : 'bg-gray-500'
                  } mr-2`} />
                  <Text className="text-lg font-semibold text-gray-800">{item.status}</Text>
                </View>
              </View>
            )}
            
            {/* Data e hora de entrada/saída, se disponíveis */}
            {(!isEmpty(item.data_entrada) || !isEmpty(item.data_saida)) && (
              <View className="flex-row mb-4 space-x-2">
                {!isEmpty(item.data_entrada) && (
                  <View className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <Text className="text-sm text-gray-500">Data de Entrada</Text>
                    <Text className="text-base font-semibold text-gray-800 mt-1">{item.data_entrada}</Text>
                    {!isEmpty(item.hora_entrada) && (
                      <Text className="text-sm text-gray-500 mt-1">{item.hora_entrada}</Text>
                    )}
                  </View>
                )}
                
                {!isEmpty(item.data_saida) && (
                  <View className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <Text className="text-sm text-gray-500">Data de Saída</Text>
                    <Text className="text-base font-semibold text-gray-800 mt-1">{item.data_saida}</Text>
                    {!isEmpty(item.hora_saida) && (
                      <Text className="text-sm text-gray-500 mt-1">{item.hora_saida}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
            
            {/* Campos adicionais */}
            {additionalFields.length > 0 ? (
              <>
                <Text className="mb-2 text-base font-medium text-gray-700">Informações Adicionais</Text>
                {additionalFields.map(([key, value]) => (
                  <View key={key} className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <Text className="text-sm text-gray-500">{formatFieldTitle(key)}</Text>
                    <Text className="text-base font-semibold text-gray-800 mt-1">{String(value)}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View className="my-3 p-5 bg-gray-50 rounded-lg border border-gray-100 items-center">
                <Text className="text-gray-500 text-center">Não há dados adicionais disponíveis</Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            className="mx-5 mb-5 mt-2 bg-indigo-500 py-3 rounded-lg items-center"
            onPress={onClose}
            style={styles.buttonShadow}
          >
            <Text className="text-white font-semibold">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Estilos adicionais que não podem ser facilmente implementados com Tailwind
const styles = StyleSheet.create({
  modalContainer: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonShadow: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  }
});

export default ItemDetailModal;