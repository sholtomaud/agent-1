import test from 'node:test';
import assert from 'node:assert';
import { MCPClient } from '../src/core/mcp.ts';
import fs from 'node:fs';

test('MCPClient - should kill process on timeout', async (t) => {
  // Create a tool that hangs indefinitely
  const toolCode = `
    setInterval(() => {
      // Keep process alive
    }, 1000);
    process.stdin.on('data', () => {
      // Just consume input but never respond
    });
  `;
  const toolFile = 'hang_tool.js';
  fs.writeFileSync(toolFile, toolCode);

  const mcp = new MCPClient('node', [toolFile], 500);

  // Access private proc for testing purposes (casting to any)
  const proc = (mcp as any).proc;
  const pid = proc.pid;

  try {
    await mcp.call('test', { val: 'hang' });
    assert.fail('Should have timed out');
  } catch (e: any) {
    assert.strictEqual(e.message, 'MCP call timed out');
  }

  // Wait a small amount for the kill signal to propagate
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check if process is killed.
  // process.kill(pid, 0) throws if the process does not exist
  let isAlive = true;
  try {
    process.kill(pid, 0);
  } catch (e) {
    isAlive = false;
  }

  assert.strictEqual(isAlive, false, 'Process should have been killed on timeout');

  mcp.close();
  if (fs.existsSync(toolFile)) fs.unlinkSync(toolFile);
});
