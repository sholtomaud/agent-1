import { TestRunnerTool } from '../src/tools/test_runner_tool.ts';
import assert from 'node:assert';
import { test, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

describe('TestRunnerTool', () => {
  const sandbox = path.join(process.cwd(), '.agent_sandbox');
  if (!fs.existsSync(sandbox)) fs.mkdirSync(sandbox);

  test('should run a test and report success', async () => {
    const testCode = `
import test from 'node:test';
import assert from 'node:assert';
test('success', () => assert.strictEqual(1, 1));
    `;
    const testPath = path.join(sandbox, 'temp.test.ts');
    fs.writeFileSync(testPath, testCode);

    const runner = new TestRunnerTool();
    // TestRunnerTool expects /sandbox/ paths or handles them
    const result = await runner.execute({ testPath: '/sandbox/temp.test.ts' });

    assert.strictEqual(result.success, true, `Result should be success. Stderr: ${result.stderr}`);
    fs.unlinkSync(testPath);
  });

  test('should run a test and report failure', async () => {
    const testCode = `
import test from 'node:test';
import assert from 'node:assert';
test('failure', () => assert.strictEqual(1, 2));
    `;
    const testPath = path.join(sandbox, 'temp_fail.test.ts');
    fs.writeFileSync(testPath, testCode);

    const runner = new TestRunnerTool();
    const result = await runner.execute({ testPath: '/sandbox/temp_fail.test.ts' });

    assert.strictEqual(result.success, false);
    fs.unlinkSync(testPath);
  });
});
