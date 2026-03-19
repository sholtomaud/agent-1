import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export class ReplayVerifier {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
  }

  verifyChain(): { valid: boolean; error?: string } {
    const rows = this.db.prepare('SELECT * FROM audit ORDER BY id ASC').all() as any[];
    let lastHash: string | null = null;

    for (const row of rows) {
      const { ts, step, type, payload, prev_hash, hash } = row;

      // Verify prev_hash matches
      if (prev_hash !== lastHash) {
        return {
          valid: false,
          error: `Hash chain broken at ID ${row.id}: expected prev_hash ${lastHash}, got ${prev_hash}`
        };
      }

      // Re-calculate hash
      const hashInput = `${ts}|${step}|${type}|${payload}|${prev_hash || ''}`;
      const calculatedHash = createHash('sha256').update(hashInput).digest('hex');

      if (calculatedHash !== hash) {
        return {
          valid: false,
          error: `Hash mismatch at ID ${row.id}: calculated ${calculatedHash}, stored ${hash}`
        };
      }

      lastHash = hash;
    }

    return { valid: true };
  }

  getSteps() {
    return this.db.prepare('SELECT * FROM audit ORDER BY id ASC').all() as any[];
  }

  close() {
    this.db.close();
  }
}
