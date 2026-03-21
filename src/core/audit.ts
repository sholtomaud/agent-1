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
        phase TEXT,
        issue_id TEXT,
        feature_name TEXT,
        phase_result TEXT,
        prev_hash TEXT,
        hash TEXT
      );
    `);
  }

  private loadLastHash() {
    const row = this.db.prepare('SELECT hash FROM audit ORDER BY id DESC LIMIT 1').get() as any;
    this.lastHash = row ? row.hash : null;
  }

  log(
    step: number,
    type: string,
    payload: any,
    metadata: {
      phase?: string;
      issue_id?: string;
      feature_name?: string;
      phase_result?: any;
    } = {}
  ) {
    const ts = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);
    const phaseResultStr = metadata.phase_result ? JSON.stringify(metadata.phase_result) : null;

    // Calculate current hash
    const hashInput = `${ts}|${step}|${type}|${payloadStr}|${metadata.phase || ''}|${metadata.issue_id || ''}|${metadata.feature_name || ''}|${phaseResultStr || ''}|${this.lastHash || ''}`;
    const hash = createHash('sha256').update(hashInput).digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO audit (ts, step, type, payload, phase, issue_id, feature_name, phase_result, prev_hash, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      ts,
      step,
      type,
      payloadStr,
      metadata.phase || null,
      metadata.issue_id || null,
      metadata.feature_name || null,
      phaseResultStr,
      this.lastHash,
      hash
    );
    this.lastHash = hash;
  }

  close() {
    this.db.close();
  }
}
