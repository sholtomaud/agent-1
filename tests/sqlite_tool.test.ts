import test from 'node:test';
import assert from 'node:assert';
import { SQLiteQueryTool } from '../src/tools/sqlite_tool.ts';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

test('SQLiteQueryTool - should allow SELECT but block UPDATE/INSERT', (t) => {
  const dbFile = 'test_sandbox.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const db = new DatabaseSync(dbFile);
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  db.prepare('INSERT INTO test (name) VALUES (?)').run('Initial');
  db.close();

  const tool = new SQLiteQueryTool(dbFile, true);

  // SELECT should work
  const selectResult = tool.query('SELECT * FROM test');
  assert.ok(selectResult.result);
  assert.strictEqual(selectResult.result.length, 1);
  assert.strictEqual((selectResult.result[0] as any).name, 'Initial');

  // UPDATE should fail
  const updateResult = tool.query('UPDATE test SET name = "Hacked" WHERE id = 1');
  assert.ok(updateResult.error);
  assert.strictEqual(updateResult.error, 'Only SELECT queries are allowed in sandboxed mode.');

  // Verify DB didn't change
  const verifyResult = tool.query('SELECT name FROM test WHERE id = 1');
  assert.strictEqual((verifyResult.result![0] as any).name, 'Initial');

  tool.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});
