import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { cssInterop } from "nativewind";

cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(TouchableOpacity, { className: "style" });

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
  containerCount?: number;
}

interface ListItemProps {
  data: OperationCardData;
  onPress?: (data: OperationCardData) => void;
}

const STATUS_STYLES: Record<string, { background: string; text: string }> = {
  andamento: { background: "#D1FAE5", text: "#047857" },
  fechada: { background: "#E0E7FF", text: "#4338CA" },
  default: { background: "#E5E7EB", text: "#374151" },
};

const ListItem: React.FC<ListItemProps> = ({ data, onPress }) => {
  const statusLabelRaw = data.status?.trim().toLowerCase() ?? "";
  const isClosed =
    statusLabelRaw.includes("fech") ||
    statusLabelRaw.includes("close") ||
    statusLabelRaw.includes("final") ||
    statusLabelRaw.includes("compl");
  const statusLabel = isClosed ? "Fechada" : "Em andamento";
  const normalizedStatus = isClosed ? "fechada" : "andamento";
  const statusTheme = STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.default;
  const trimmedOperationCode = data.operationCode?.trim() ?? "";
  const containerCount =
    typeof data.containerCount === "number" ? data.containerCount : 0;
  const operationLabel =
    data.containerId?.trim().length
      ? data.containerId.trim()
      : typeof data.operationId === "number" && Number.isFinite(data.operationId)
        ? `OP-${data.operationId}`
        : trimmedOperationCode.length > 0
          ? trimmedOperationCode
          : "Operacao";

  return (
    <TouchableOpacity
      className="w-full"
      activeOpacity={0.85}
      onPress={() => onPress?.(data)}
    >
      <View
        className="bg-white rounded-2xl p-5 mb-2 border"
        style={{
          borderColor: "#E5E7EB",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#94A3B8" }}
            >
              Operacao
            </Text>
            <Text
              className="text-xl font-semibold mt-1"
              style={{ color: "#1F2937" }}
            >
              {operationLabel}
            </Text>
      </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusTheme.background }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: statusTheme.text }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type { OperationCardData };
export default ListItem;
