import SQLite, { ResultSet } from "react-native-sqlite-storage";

export type OfflineOperationPayload = Record<string, any>;
export type OfflineQueueType = "operation" | "container-create" | "container-update";

export type QueuedOperation = {
  id: number;
  type: OfflineQueueType;
  payload: OfflineOperationPayload;
  createdAt: number;
  status: "pending" | "failed";
  lastError?: string | null;
};

const DB_NAME = "noct-offline.db";
const TABLE_NAME = "queued_operations";

SQLite.enablePromise(true);
const dbPromise = SQLite.openDatabase({ name: DB_NAME, location: "default" });

const runQuery = async (sql: string, params: any[] = []): Promise<ResultSet> => {
  const db = await dbPromise;
  const results = await db.executeSql(sql, params);
  return results[0];
};

export const ensureOfflineDb = async () => {
  await runQuery(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      last_error TEXT
    );`,
  );

  // Migração simples para adicionar coluna "type" se não existir
  const tableInfo = await runQuery(`PRAGMA table_info(${TABLE_NAME});`);
  const columns =
    (tableInfo.rows as any)?.raw?.() ??
    Array.from({ length: tableInfo.rows.length }, (_, i) => tableInfo.rows.item(i));
  const hasTypeColumn = columns.some((c: any) => c?.name === "type");
  if (!hasTypeColumn) {
    await runQuery(`ALTER TABLE ${TABLE_NAME} ADD COLUMN type TEXT NOT NULL DEFAULT 'operation';`);
  }
};

const parseRow = (row: any): QueuedOperation => {
  let payload: OfflineOperationPayload = {};

  try {
    payload = row?.payload ? JSON.parse(row.payload) : {};
  } catch {
    payload = {};
  }

  return {
    id: row?.id,
    type: (row?.type as OfflineQueueType) ?? "operation",
    payload,
    createdAt: row?.created_at,
    status: row?.status === "failed" ? "failed" : "pending",
    lastError: row?.last_error ?? null,
  };
};

export const queueOperationLocally = async (
  payload: OfflineOperationPayload,
  type: OfflineQueueType = "operation",
) => {
  await ensureOfflineDb();
  const serialized = JSON.stringify(payload ?? {});
  await runQuery(
    `INSERT INTO ${TABLE_NAME} (payload, created_at, status, type) VALUES (?, ?, 'pending', ?)`,
    [serialized, Date.now(), type],
  );
};

export const getQueuedOperations = async (): Promise<QueuedOperation[]> => {
  await ensureOfflineDb();
  const result = await runQuery(
    `SELECT id, payload, created_at, status, last_error, type FROM ${TABLE_NAME}
     WHERE status IN ('pending', 'failed') ORDER BY created_at ASC`,
  );
  const rows =
    (result.rows as any)?.raw?.() ??
    Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
  return rows.map(parseRow);
};

export const deleteQueuedOperation = async (id: number) => {
  await ensureOfflineDb();
  await runQuery(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
};

export const markQueuedOperationFailed = async (id: number, error?: string) => {
  await ensureOfflineDb();
  await runQuery(
    `UPDATE ${TABLE_NAME} SET status = 'failed', last_error = ? WHERE id = ?`,
    [error ? error.slice(0, 250) : null, id],
  );
};

export const countQueuedOperations = async (): Promise<number> => {
  await ensureOfflineDb();
  const result = await runQuery(
    `SELECT COUNT(*) as total FROM ${TABLE_NAME} WHERE status IN ('pending', 'failed')`,
  );
  const rows =
    (result.rows as any)?.raw?.() ??
    Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
  return rows?.[0]?.total ?? 0;
};

// Helpers especializados para containers
export const queueContainerCreateLocally = async (payload: OfflineOperationPayload) => {
  await queueOperationLocally(payload, "container-create");
};

export const queueContainerUpdateLocally = async (payload: OfflineOperationPayload) => {
  await queueOperationLocally(payload, "container-update");
};

export const deleteQueuedContainersById = async (containerId: string) => {
  await ensureOfflineDb();
  await runQuery(
    `DELETE FROM ${TABLE_NAME}
     WHERE type IN ('container-create','container-update')
       AND (
         json_extract(payload, '$.containerId') = ?
         OR json_extract(payload, '$.body.containerId') = ?
       )`,
    [containerId, containerId],
  );
};
