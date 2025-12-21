declare module "react-native-sqlite-storage" {
  export interface ResultSetRowList {
    length: number;
    item(index: number): any;
    raw?: () => any[];
  }

  export interface ResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: ResultSetRowList;
  }

  export interface SQLiteDatabaseConfig {
    name: string;
    location?: string;
  }

  export interface SQLiteDatabase {
    executeSql(statement: string, params?: any[]): Promise<ResultSet[]>;
  }

  export function enablePromise(enabled: boolean): void;
  export function openDatabase(config: SQLiteDatabaseConfig): Promise<SQLiteDatabase>;

  const SQLite: {
    enablePromise: typeof enablePromise;
    openDatabase: typeof openDatabase;
  };

  export default SQLite;
}
