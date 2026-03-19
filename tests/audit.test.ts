import test from 'node:test';
import assert from 'node:assert';
import { AuditLog } from '../src/core/audit.ts';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

test('AuditLog - should create audit table and log entries', (t) => {
  const dbFile = 'test_audit.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const audit = new AuditLog(dbFile);

  const payload = { action: 'test', data: 123 };
  audit.log(1, 'test_type', payload);

  const db = new DatabaseSync(dbFile);
  const rows = db.prepare('SELECT * FROM audit').all() as any[];

  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].step, 1);
  assert.strictEqual(rows[0].type, 'test_type');
  assert.strictEqual(JSON.parse(rows[0].payload).action, 'test');

  db.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});

test('AuditLog - should maintain a hash chain for integrity', (t) => {
  const dbFile = 'test_chain.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const audit = new AuditLog(dbFile);

  audit.log(1, 'type1', { val: 1 });
  audit.log(2, 'type2', { val: 2 });

  const db = new DatabaseSync(dbFile);
  const rows = db.prepare('SELECT * FROM audit ORDER BY id ASC').all() as any[];

  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].prev_hash, null);
  assert.notStrictEqual(rows[1].prev_hash, null);
  assert.strictEqual(rows[1].prev_hash, rows[0].hash);

  db.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});
