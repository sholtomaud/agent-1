import test from 'node:test';
import assert from 'node:assert';
import { AgentRuntime } from '../src/core/runtime.ts';
import { AuditLog } from '../src/core/audit.ts';
import { MCPClient } from '../src/core/mcp.ts';
import fs from 'node:fs';
import http from 'node:http';
import { z } from 'zod';

test('AgentRuntime - should retry and self-correct on validation error', async (t) => {
  const dbFile = 'test_validation.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  let attempt = 0;
  let lastPrompt = '';

  // Mock LLM server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      attempt++;
      console.log(`LLM Request ${attempt}, Prompt contains error: ${parsed.prompt.includes('Error:')}`);
      if (attempt === 1) {
        // First call, provide invalid tool call (missing field or wrong type)
        res.end('{"tool": "test", "args": {"wrong_key": 42}}');
      } else if (attempt === 2) {
        lastPrompt = parsed.prompt; // This should be the retry prompt
        // Second call (retry), fix the tool call
        res.end('{"tool": "test", "args": {"val": 42}}');
      } else {
        res.end('Success!');
      }
    });
  });

  const port = 8085;
  await new Promise<void>(resolve => server.listen(port, resolve));

  // Mock MCP tool
  const toolCode = `
    process.stdin.on('data', (chunk) => {
      const msg = JSON.parse(chunk.toString());
      if (msg.method === 'test') {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: { ok: true }
        }));
      }
    });
  `;
  const toolFile = 'test_val_tool.js';
  fs.writeFileSync(toolFile, toolCode);

  const audit = new AuditLog(dbFile);
  const mcp = new MCPClient('node', [toolFile]);
  const runtime = new AgentRuntime(audit, mcp, 'http://localhost:' + port);

  // Register schema
  runtime.registerTool('test', z.object({
    val: z.number()
  }));

  try {
    await runtime.run('Test me.');
  } catch (e) {
    console.log('Runtime Error:', e);
  } finally {
    mcp.close();
    server.close();
    audit.close();
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    if (fs.existsSync(toolFile)) fs.unlinkSync(toolFile);
  }

  console.log('Last Prompt:', lastPrompt);
  assert.ok(lastPrompt.includes('Error: Invalid arguments for tool "test": val:'), 'Prompt should include validation error');
  assert.ok(lastPrompt.includes('Your previous tool call was invalid'), 'Prompt should include retry message');
});
