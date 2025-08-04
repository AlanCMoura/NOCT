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
      className="bg-white rounded-xl p-4 w-11/12 mx-4 shadow-md"
      style={{
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#2A2E40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
      onPress={() => onPress && onPress(data)}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text 
            className="text-lg font-semibold" 
            style={{ color: '#2A2E40' }}
          >
            {data.operacao}
          </Text>
          <Text 
            className="text-sm mt-1" 
            style={{ color: '#6D7380' }}
          >
            Container: {data.container}
          </Text>
        </View>
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: '#F0F9F7' }}
        >
          <Text 
            className="font-medium" 
            style={{ color: '#2A2E40' }}
          >
            {data.qtde_fotos} fotos
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ListItem;