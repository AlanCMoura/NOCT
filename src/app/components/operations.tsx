import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cssInterop } from 'nativewind';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });

// Definindo interface para as props
interface ListItemProps {
  data: {
    operacao: string;
    container: string;
    qtde_fotos: string;
    [key: string]: any;
  };
  onPress?: (data: ListItemProps['data']) => void;
}

const ListItem: React.FC<ListItemProps> = ({ data, onPress }) => {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 w-11/12 mx-4 shadow-md border border-gray-100"
      onPress={() => onPress && onPress(data)}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold text-gray-800">{data.operacao}</Text>
          <Text className="text-sm text-gray-500 mt-1">Container: {data.container}</Text>
        </View>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-700 font-medium">{data.qtde_fotos} fotos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ListItem;