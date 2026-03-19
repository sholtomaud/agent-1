import { DatabaseSync } from 'node:sqlite';

export class SQLiteQueryTool {
  private db: DatabaseSync;

  constructor(dbPath: string, readOnly: boolean = true) {
    // In Node.js DatabaseSync, there's no direct flag for read-only in the constructor
    // BUT we can use PRAGMA or just rely on the fact that we're exposing it as a query-only tool.
    // However, the best way to enforce read-only at the SQLite level is using specific flags if available.
    // Since DatabaseSync is experimental, we'll implement a wrapper that only allows SELECT.
    this.db = new DatabaseSync(dbPath);
  }

  query(sql: string, params: any[] = []): { result?: any[]; error?: string } {
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT')) {
      return { error: 'Only SELECT queries are allowed in sandboxed mode.' };
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(...params);
      return { result };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  close() {
    this.db.close();
  }
}
