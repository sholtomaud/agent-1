import { VFSTool } from '../src/tools/vfs_tool.ts';
import { TestRunnerTool } from '../src/tools/test_runner_tool.ts';
import assert from 'node:assert';
import { test, describe, before, after } from 'node:test';
import fs from 'node:fs';

describe('VFS and TestRunner Integration', () => {
  let vfsTool: VFSTool;
  let testRunner: TestRunnerTool;

  before(() => {
    vfsTool = new VFSTool('/sandbox');
    testRunner = new TestRunnerTool();
  });

  after(() => {
    vfsTool.close();
  });

  test('should run a test file written to VFS', async () => {
    const testPath = '/sandbox/vfs_test.test.ts';
    const testCode = `
import test from 'node:test';
import assert from 'node:assert';
test('vfs success', () => assert.strictEqual(1, 1));
    `;

    // Write to VFS
    await vfsTool.execute({
      action: 'writeFile',
      path: testPath,
      content: testCode
    });

    // Run via TestRunner
    const result = await testRunner.execute({
      testPath: testPath
    });

    assert.strictEqual(result.success, true, `Test should pass. Error: ${result.stderr}`);
    assert.ok(result.stdout.includes('vfs success'), 'Output should contain test name');
  });

  test('should fail for failing test in VFS', async () => {
    const testPath = '/sandbox/vfs_fail.test.ts';
    const testCode = `
import test from 'node:test';
import assert from 'node:assert';
test('vfs failure', () => assert.strictEqual(1, 2));
    `;

    // Write to VFS
    await vfsTool.execute({
      action: 'writeFile',
      path: testPath,
      content: testCode
    });

    // Run via TestRunner
    const result = await testRunner.execute({
      testPath: testPath
    });

    assert.strictEqual(result.success, false, 'Test should fail');
    assert.ok(result.stdout.includes('vfs failure'), 'Output should contain test name');
  });
});
