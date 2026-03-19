import test from 'node:test';
import assert from 'node:assert';
import { AgentRuntime } from '../src/core/runtime.ts';
import { AuditLog } from '../src/core/audit.ts';
import { MCPClient } from '../src/core/mcp.ts';
import fs from 'node:fs';
import http from 'node:http';
import { z } from 'zod';

test('AgentRuntime - should handle a multi-step loop with tool calls', async (t) => {
  const dbFile = 'test_runtime.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  // Mock LLM server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      if (parsed.prompt.includes('Tool result: {"echo":42}')) {
        // Second call, provide final answer
        res.end('The result is 42.');
      } else {
        // First call, provide tool call
        res.end('{"tool": "test", "args": {"val": 42}}');
      }
    });
  });
  await new Promise<void>(resolve => server.listen(8086, resolve));

  // Mock MCP tool
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
  fs.writeFileSync('test_runtime_tool.js', toolCode);

  const audit = new AuditLog(dbFile);
  const mcp = new MCPClient('node', ['test_runtime_tool.js']);
  const runtime = new AgentRuntime(audit, mcp, 'http://localhost:8086');

  // Register tool schema
  runtime.registerTool('test', z.object({ val: z.number() }));

  const finalAnswer = await runtime.run('What is the echo of 42?');

  assert.strictEqual(finalAnswer, 'The result is 42.');

  mcp.close();
  server.close();
  audit.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  if (fs.existsSync('test_runtime_tool.js')) fs.unlinkSync('test_runtime_tool.js');
});
