import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cssInterop } from 'nativewind';

// Habilita o uso de className com NativeWind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });

interface OperationCardData {
  operationId: number;
  operationCode: string;
  containerId: string;
  reservation?: string;
  vessel?: string;
  createdAt?: string;
  status?: string;
  photoCount?: number;
  responsible?: string;
}

interface ListItemProps {
  data: OperationCardData;
  onPress?: (data: OperationCardData) => void;
}

const STATUS_STYLES: Record<string, { background: string; text: string }> = {
  aberta: { background: '#DCFCE7', text: '#16A34A' },
  fechada: { background: '#E0EAFF', text: '#3730A3' },
  pendente: { background: '#FEF3C7', text: '#B45309' },
  default: { background: '#E5E7EB', text: '#374151' },
};

const ListItem: React.FC<ListItemProps> = ({ data, onPress }) => {
  const statusLabel = data.status || 'Aberta';
  const normalizedStatus = statusLabel.trim().toLowerCase();
  const statusTheme = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.default;

  const photoChipLabel = (() => {
    if (typeof data.photoCount !== 'number' || data.photoCount === 0) {
      return 'Sem fotos';
    }
    if (data.photoCount === 1) {
      return '1 foto';
    }
    return `${data.photoCount} fotos`;
  })();

  return (
    <TouchableOpacity
      className="w-full"
      activeOpacity={0.85}
      onPress={() => onPress?.(data)}
    >
      <View
        className="bg-white rounded-2xl p-5 mb-4 border"
        style={{
          borderColor: '#E5E7EB',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
              Operação
            </Text>
            <Text className="text-xl font-semibold mt-1" style={{ color: '#1F2937' }}>
              {data.operationCode}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: statusTheme.background,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: statusTheme.text }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View className="mt-4 space-y-3">
          <View className="flex-row">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
                Container
              </Text>
              <Text className="text-sm mt-1" style={{ color: '#1F2937' }}>
                {data.containerId || 'â€”'}
              </Text>
            </View>
            <View className="flex-1 pl-3">
              <Text className="text-[11px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
                Reserva
              </Text>
              <Text className="text-sm mt-1" style={{ color: '#1F2937' }}>
                {data.reservation || 'Não informado'}
              </Text>
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
                Navio
              </Text>
              <Text className="text-sm mt-1" style={{ color: '#1F2937' }} numberOfLines={2}>
                {data.vessel || 'NÃ£o informado'}
              </Text>
            </View>
            <View className="flex-1 pl-3 mt-1">
              <Text className="text-[11px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
                Data
              </Text>
              <Text className="text-sm mt-1" style={{ color: '#1F2937' }}>
                {data.createdAt || 'â€”'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
              Responsável
            </Text>
            <Text className="text-sm mt-1" style={{ color: '#1F2937' }}>
              {data.responsible || 'Equipe NOCT'}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <Text className="text-xs font-semibold" style={{ color: '#1F2937' }}>
              {photoChipLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type { OperationCardData };
export default ListItem;

