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
  aberta: { background: "rgba(250, 204, 21, 0.18)", text: "#92400E" },
  fechada: { background: "rgba(34, 197, 94, 0.14)", text: "#047857" },
  default: { background: "#E5E7EB", text: "#374151" },
};

const ListItem: React.FC<ListItemProps> = ({ data, onPress }) => {
  const statusLabelRaw = data.status?.trim().toLowerCase() ?? "";
  const isClosed =
    statusLabelRaw.includes("fech") ||
    statusLabelRaw.includes("close") ||
    statusLabelRaw.includes("final") ||
    statusLabelRaw.includes("compl");
  const statusLabel = isClosed ? "Fechada" : "Aberta";
  const normalizedStatus = isClosed ? "fechada" : "aberta";
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
  const idLabel =
    Number.isFinite(data.operationId) && data.operationId !== null && data.operationId !== undefined
      ? `ID: ${data.operationId}`
      : "";
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleString("pt-BR")
    : "—";
  const vesselLabel =
    data.vessel && data.vessel.trim().length > 0 ? data.vessel.trim() : "—";

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
            {idLabel ? (
              <Text className="text-xs mt-1 font-semibold" style={{ color: "#6B7280" }}>
                {idLabel}
              </Text>
            ) : null}
            <View className="mt-3">
              <View className="flex-row justify-between">
                <Text className="text-xs font-semibold" style={{ color: "#94A3B8" }}>
                  Criada
                </Text>
                <Text className="text-xs font-semibold" style={{ color: "#94A3B8" }}>
                  Navio
                </Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-sm font-semibold" style={{ color: "#1F2937" }}>
                  {formattedDate}
                </Text>
                <Text className="text-sm font-semibold" style={{ color: "#1F2937" }}>
                  {vesselLabel}
                </Text>
              </View>
            </View>
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
