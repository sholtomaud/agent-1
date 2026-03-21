import { AuditLog } from '../src/core/audit.ts';
import { VFSTool, VFSArgsSchema } from '../src/tools/vfs_tool.ts';
import assert from 'node:assert';
import { test, describe, before, after } from 'node:test';
import fs from 'node:fs';

describe('VFSTool', () => {
  let vfsTool: VFSTool;

  before(() => {
    vfsTool = new VFSTool('/test_sandbox');
  });

  after(() => {
    vfsTool.close();
  });

  test('should write and read a file', async () => {
    const writeResult = await vfsTool.execute({
      action: 'writeFile',
      path: '/test_sandbox/hello.txt',
      content: 'hello world'
    });
    assert.strictEqual((writeResult as any).success, true);

    const readResult = await vfsTool.execute({
      action: 'readFile',
      path: '/test_sandbox/hello.txt'
    });
    assert.strictEqual(readResult, 'hello world');
  });

  test('should check if file exists', async () => {
    const existsResult = await vfsTool.execute({
      action: 'exists',
      path: '/test_sandbox/hello.txt'
    });
    assert.strictEqual(existsResult, true);
  });

  test('should list directory', async () => {
    const readdirResult = await vfsTool.execute({
      action: 'readdir',
      path: '/test_sandbox'
    });
    assert.ok(Array.isArray(readdirResult));
    assert.ok(readdirResult.includes('hello.txt'));
  });
});
