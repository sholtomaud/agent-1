import test from 'node:test';
import assert from 'node:assert';
import { MCPClient } from '../src/core/mcp.ts';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

test('MCPClient - should communicate over stdio via JSON-RPC', async (t) => {
  // Create a simple mock tool
  const toolCode = `
    process.stdin.on('data', (chunk) => {
      const msg = JSON.parse(chunk.toString());
      if (msg.method === 'test') {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: { echo: msg.params.val }
        }));
      }
    });
  `;
  fs.writeFileSync('mock_tool.js', toolCode);

  const mcp = new MCPClient('node', ['mock_tool.js']);
  const result = await mcp.call('test', { val: 42 });

  assert.strictEqual(result.result.echo, 42);

  mcp.close();
  if (fs.existsSync('mock_tool.js')) fs.unlinkSync('mock_tool.js');
});

test('MCPClient - should handle timeouts', async (t) => {
  // Create a tool that never responds
  const toolCode = `
    // Doing nothing
  `;
  fs.writeFileSync('timeout_tool.js', toolCode);

  const mcp = new MCPClient('node', ['timeout_tool.js'], 500);

  try {
    await mcp.call('test', {});
    assert.fail('Should have timed out');
  } catch (e: any) {
    assert.strictEqual(e.message, 'MCP call timed out');
  }

  mcp.close();
  if (fs.existsSync('timeout_tool.js')) fs.unlinkSync('timeout_tool.js');
});
