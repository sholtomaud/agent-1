import { AuditLog } from './core/audit.ts';
import { MCPClient } from './core/mcp.ts';
import { AgentRuntime } from './core/runtime.ts';
import { TDDWorkflow } from './core/workflow.ts';
import { VFSTool, VFSArgsSchema } from './tools/vfs_tool.ts';
import { TestRunnerTool, TestRunnerArgsSchema } from './tools/test_runner_tool.ts';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';
import http from 'node:http';

async function main() {
  console.log('VeritasAgent V3 (Deterministic Runtime)');
  console.log('---------------------------------------');

  // Initialize components
  const dbPath = process.env.DB_PATH || 'agent_v3.db';
  const audit = new AuditLog(dbPath);

  // Example tool setup: tool.js should exist and follow MCP stdio protocol
  if (!fs.existsSync('tool.js')) {
    const toolCode = `
process.stdin.on('data', (chunk) => {
  try {
    const msg = JSON.parse(chunk.toString());
    if (msg.method === "add") {
      const { a, b } = msg.params;
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: a + b
      }));
    } else if (msg.method === "sqlite_query") {
      // In a real V3, this would be a separate tool with restricted access
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: "Query executed (mock)"
      }));
    } else {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        error: "unknown tool"
      }));
    }
  } catch (e) {
    // Error handling
  }
});
    `;
    fs.writeFileSync('tool.js', toolCode);
  }

  const mcp = new MCPClient('node', ['tool.js']);
  const llmUrl = process.env.LLM_URL || 'http://localhost:8080/completion'; // Default llama.cpp port

  const runtime = new AgentRuntime(audit, mcp, llmUrl);

  // Register tools
  const vfsTool = new VFSTool();
  runtime.registerTool('vfs_tool', VFSArgsSchema, (args) => vfsTool.execute(args));

  const testRunner = new TestRunnerTool();
  runtime.registerTool('test_runner_tool', TestRunnerArgsSchema, (args) => testRunner.execute(args));

  const mode = process.env.MODE || 'cli';

  if (mode === 'server') {
    const port = parseInt(process.env.PORT || '3000');
    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }
        try {
          const { message } = JSON.parse(body);
          const answer = await runtime.run(message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ answer }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      console.log(`Server mode enabled, listening on port ${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...');
      server.close();
      mcp.close();
      audit.close();
      process.exit(0);
    });
  } else {
    const rl = readline.createInterface({ input, output });
    while (true) {
      const user = await rl.question('\n> ');
      if (user.toLowerCase() === 'exit') break;

      try {
        if (user.toLowerCase().startsWith('tdd:')) {
          // Format: tdd:issue_id:feature_name:task
          const parts = user.split(':');
          let issue_id = 'manual';
          let feature_name = 'manual';
          let task = '';

          if (parts.length >= 4) {
            issue_id = parts[1];
            feature_name = parts[2];
            task = parts.slice(3).join(':').trim();
          } else {
            task = user.slice(4).trim();
          }

          const workflow = new TDDWorkflow(runtime, { issue_id, feature_name });
          const answer = await workflow.run(task);
          console.log('\nWorkflow Result:', answer);
        } else {
          const answer = await runtime.run(user);
          console.log('\nFinal:', answer);
        }
      } catch (err: any) {
        console.error('\n❌ Error:', err.message);
      }
    }
    mcp.close();
    audit.close();
    rl.close();
  }
}

main().catch(console.error);
