import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { API_BASE_URL } from "../../config/apiConfig";
import {
  OfflineOperationPayload,
  countQueuedOperations,
  deleteQueuedOperation,
  ensureOfflineDb,
  getQueuedOperations,
  markQueuedOperationFailed,
  queueContainerCreateLocally,
  queueContainerUpdateLocally,
  queueOperationLocally,
} from "../storage/offlineOperations";
import { useAuthenticatedFetch, useAuth } from "./_AuthContext";

type OfflineOperationsContextValue = {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncError: string | null;
  queueOperation: (payload: OfflineOperationPayload) => Promise<void>;
  queueContainerCreate: (payload: ContainerCreateQueuePayload) => Promise<void>;
  queueContainerUpdate: (payload: ContainerUpdateQueuePayload) => Promise<void>;
  pendingSummaries: PendingSummary[];
  syncPendingOperations: () => Promise<{ synced: number; failed: number }>;
};

type OfflineImageUpload = { uri: string; field: string };

type ContainerCreateQueuePayload = {
  body: {
    containerId: string;
    description: string;
    operationId: string | number;
    sacksCount: number;
    tareTons: number;
    liquidWeight: number;
    grossWeight: number;
    agencySeal: string;
    otherSeals: string[];
  };
  images?: OfflineImageUpload[];
};

type ContainerUpdateQueuePayload = ContainerCreateQueuePayload & {
  containerId: string;
  removedImages?: Array<{ apiCategory: string; ids: string[]; urls: string[] }>;
};

type PendingSummary = {
  id: number;
  type: string;
  label: string;
  operationId?: string | number | null;
  containerId?: string | number | null;
};

const OfflineOperationsContext = createContext<OfflineOperationsContextValue | undefined>(undefined);

export const OfflineOperationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [pendingSummaries, setPendingSummaries] = useState<PendingSummary[]>([]);

  const authFetch = useAuthenticatedFetch();
  const { isAuthenticated } = useAuth();

  const refreshPendingInfo = useCallback(async () => {
    try {
      const queued = await getQueuedOperations();
      setPendingCount(queued.length);
      const summaries = queued.map((op) => {
        const payload: any = op.payload ?? {};
        const opId =
          payload.operationId ??
          payload.body?.operationId ??
          payload.id ??
          null;
        const containerId =
          payload.containerId ??
          payload.body?.containerId ??
          payload.code ??
          null;
        const idText =
          op.type?.includes("container")
            ? (containerId != null ? String(containerId) : `fila-${op.id}`)
            : (opId != null ? String(opId) : `fila-${op.id}`);
        return {
          id: op.id,
          type: op.type,
          label: op.type?.includes("container") ? idText : `${op.type}:${idText}`,
          operationId: opId,
          containerId,
        };
      });
      setPendingSummaries(summaries);
    } catch (error) {
      console.error("Erro ao contar operações offline:", error);
    }
  }, []);

  const queueOperation = useCallback(
    async (payload: OfflineOperationPayload) => {
      await queueOperationLocally(payload);
      await refreshPendingInfo();
    },
    [refreshPendingInfo],
  );

  const queueContainerCreate = useCallback(
    async (payload: ContainerCreateQueuePayload) => {
      await queueContainerCreateLocally(payload);
      await refreshPendingInfo();
    },
    [refreshPendingInfo],
  );

  const queueContainerUpdate = useCallback(
    async (payload: ContainerUpdateQueuePayload) => {
      await queueContainerUpdateLocally(payload);
      await refreshPendingInfo();
    },
    [refreshPendingInfo],
  );

  const syncOperationJob = useCallback(
    async (op: { id: number; payload: OfflineOperationPayload }) => {
      const response = await authFetch(`${API_BASE_URL}/operations`, {
        method: "POST",
        body: JSON.stringify(op.payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
      }
    },
    [authFetch],
  );

  const syncContainerCreateJob = useCallback(
    async (op: { id: number; payload: ContainerCreateQueuePayload }) => {
      const body = op.payload?.body;
      if (!body) throw new Error("Payload de container inválido");

      const images = op.payload?.images ?? [];
      if (images.length > 0) {
        const form = new FormData();
        form.append("containerId", body.containerId ?? "");
        form.append("description", body.description ?? "");
        form.append("operationId", String(body.operationId ?? ""));
        form.append("sacksCount", String(body.sacksCount ?? 0));
        form.append("tareTons", String(body.tareTons ?? 0));
        form.append("liquidWeight", String(body.liquidWeight ?? 0));
        form.append("grossWeight", String(body.grossWeight ?? 0));
        form.append("agencySeal", body.agencySeal ?? "");
        (body.otherSeals ?? []).forEach((seal) => form.append("otherSeals", seal));

        images.forEach((img, idx) => {
          const filename = `${img.field}_${idx}_${Date.now()}.jpg`;
          form.append(img.field, {
            uri: img.uri,
            name: filename,
            type: "image/jpeg",
          } as any);
        });

        const response = await authFetch(`${API_BASE_URL}/containers/images`, {
          method: "POST",
          body: form,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
        }
      } else {
        const response = await authFetch(`${API_BASE_URL}/containers`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
        }
      }
    },
    [authFetch],
  );

  const syncContainerUpdateJob = useCallback(
    async (op: { id: number; payload: ContainerUpdateQueuePayload }) => {
      const body = op.payload?.body;
      const containerId = op.payload?.containerId;
      if (!body || !containerId) throw new Error("Payload de atualização de container inválido");

      // Atualiza dados do container
      const updateResp = await authFetch(
        `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );
      if (!updateResp.ok) {
        const errText = await updateResp.text().catch(() => "");
        throw new Error(`HTTP ${updateResp.status} ${updateResp.statusText}: ${errText}`);
      }

      // Deleta imagens removidas
      const removedImages = op.payload?.removedImages ?? [];
      for (const item of removedImages) {
        const ids = item.ids ?? [];
        const urls = item.urls ?? [];

        for (const imageId of ids) {
          try {
            const resp = await authFetch(
              `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}/images/${encodeURIComponent(imageId)}`,
              { method: "DELETE" },
            );
            if (!resp.ok && resp.status !== 404) {
              throw new Error(`Falha ao excluir imagem ${imageId}`);
            }
          } catch (err) {
            console.warn("Falha ao excluir imagem por ID:", err);
          }
        }

        for (const url of urls) {
          try {
            const resp = await authFetch(
              `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}/images?imageUrl=${encodeURIComponent(url)}`,
              { method: "DELETE" },
            );
            if (!resp.ok && resp.status !== 404) {
              throw new Error(`Falha ao excluir imagem ${url}`);
            }
          } catch (err) {
            console.warn("Falha ao excluir imagem por URL:", err);
          }
        }
      }

      const images = op.payload?.images ?? [];
      if (images.length > 0) {
        const form = new FormData();
        images.forEach((img, idx) => {
          const filename = `${img.field}_${idx}_${Date.now()}.jpg`;
          form.append(img.field, {
            uri: img.uri,
            name: filename,
            type: "image/jpeg",
          } as any);
        });

        const uploadResp = await authFetch(
          `${API_BASE_URL}/containers/${encodeURIComponent(containerId)}/images`,
          {
            method: "POST",
            body: form,
          },
        );

        if (!uploadResp.ok) {
          const errorText = await uploadResp.text().catch(() => "");
          throw new Error(`Upload de imagens falhou: ${errorText}`);
        }
      }
    },
    [authFetch],
  );

  const syncPendingOperations = useCallback(async () => {
    await ensureOfflineDb();

    if (!isAuthenticated) {
      setLastSyncError("Usuário não autenticado para sincronizar.");
      return { synced: 0, failed: 0 };
    }

    const queuedBefore = await getQueuedOperations();
    const pendingContainersBefore = queuedBefore.filter((op) => op.type?.includes("container")).length;

    const networkState = await NetInfo.fetch();
    const hasConnection =
      networkState?.isConnected === true && networkState?.isInternetReachable !== false;

    if (!hasConnection) {
      setLastSyncError("Sem conexão para sincronizar operações.");
      return { synced: 0, failed: 0 };
    }

    const queued = await getQueuedOperations();
    if (queued.length === 0) {
      setLastSyncError(null);
      setPendingCount(0);
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    setLastSyncError(null);
    let synced = 0;
    let failed = 0;

    try {
      for (const op of queued) {
        try {
          if (op.type === "container-create") {
            await syncContainerCreateJob(op as any);
          } else if (op.type === "container-update") {
            await syncContainerUpdateJob(op as any);
          } else {
            await syncOperationJob(op);
          }
          await deleteQueuedOperation(op.id);
      synced += 1;
        } catch (error: any) {
          failed += 1;
          await markQueuedOperationFailed(
            op.id,
            error?.message ? String(error.message) : String(error),
          );
        }
      }
    } finally {
      setIsSyncing(false);
      await refreshPendingInfo();

      setLastSyncError(failed > 0 ? "Algumas operações permanecem na fila." : null);
    }

    return { synced, failed };
  }, [isAuthenticated, refreshPendingInfo, syncContainerCreateJob, syncContainerUpdateJob, syncOperationJob]);

  useEffect(() => {
    ensureOfflineDb().then(refreshPendingInfo).catch(() => {
      // Erros já são logados dentro de ensureOfflineDb
    });
  }, [refreshPendingInfo]);

  useEffect(() => {
    if (isAuthenticated) {
      syncPendingOperations();
    }
  }, [isAuthenticated, syncPendingOperations]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const initial = await NetInfo.fetch();
      if (
        initial?.isConnected &&
        initial.isInternetReachable !== false &&
        isAuthenticated
      ) {
        syncPendingOperations();
      }

      unsubscribe = NetInfo.addEventListener((state) => {
        const isOnline = state.isConnected && state.isInternetReachable !== false;
        if (isOnline && isAuthenticated) {
          syncPendingOperations();
        }
      });
    };

    setupListener();

    return () => {
      unsubscribe?.();
    };
  }, [isAuthenticated, syncPendingOperations]);

  const value: OfflineOperationsContextValue = {
    pendingCount,
    pendingSummaries,
    isSyncing,
    lastSyncError,
    queueOperation,
    queueContainerCreate,
    queueContainerUpdate,
    syncPendingOperations,
  };

  return (
    <OfflineOperationsContext.Provider value={value}>
      {children}
    </OfflineOperationsContext.Provider>
  );
};

export const useOfflineOperations = () => {
  const context = useContext(OfflineOperationsContext);
  if (!context) {
    throw new Error("useOfflineOperations deve ser usado dentro de OfflineOperationsProvider");
  }
  return context;
};
