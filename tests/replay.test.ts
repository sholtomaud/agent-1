import test from 'node:test';
import assert from 'node:assert';
import { AuditLog } from '../src/core/audit.ts';
import { ReplayVerifier } from '../src/core/replay.ts';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

test('ReplayVerifier - should verify a valid hash chain', (t) => {
  const dbFile = 'test_replay_valid.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const audit = new AuditLog(dbFile);
  audit.log(0, 'test', { val: 1 });
  audit.log(1, 'test', { val: 2 });
  audit.close();

  const verifier = new ReplayVerifier(dbFile);
  const result = verifier.verifyChain();

  assert.strictEqual(result.valid, true);

  verifier.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});

test('ReplayVerifier - should detect tampering', (t) => {
  const dbFile = 'test_replay_tamper.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const audit = new AuditLog(dbFile);
  audit.log(0, 'test', { val: 1 });
  audit.log(1, 'test', { val: 2 });
  audit.close();

  // Tamper with the database
  const db = new DatabaseSync(dbFile);
  db.prepare("UPDATE audit SET payload = '{\"val\": 99}' WHERE step = 1").run();
  db.close();

  const verifier = new ReplayVerifier(dbFile);
  const result = verifier.verifyChain();

  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('Hash mismatch'));

  verifier.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});
