import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export class AuditLog {
  private db: DatabaseSync;
  private lastHash: string | null = null;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.init();
    this.loadLastHash();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        step INTEGER,
        type TEXT,
        payload TEXT,
        prev_hash TEXT,
        hash TEXT
      );
    `);
  }

  private loadLastHash() {
    const row = this.db.prepare('SELECT hash FROM audit ORDER BY id DESC LIMIT 1').get() as any;
    this.lastHash = row ? row.hash : null;
  }

  log(step: number, type: string, payload: any) {
    const ts = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    // Calculate current hash
    const hashInput = `${ts}|${step}|${type}|${payloadStr}|${this.lastHash || ''}`;
    const hash = createHash('sha256').update(hashInput).digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO audit (ts, step, type, payload, prev_hash, hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(ts, step, type, payloadStr, this.lastHash, hash);
    this.lastHash = hash;
  }

  close() {
    this.db.close();
  }
}
