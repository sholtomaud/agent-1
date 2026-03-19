import { AuditLog } from './core/audit.ts';
import { MCPClient } from './core/mcp.ts';
import { AgentRuntime } from './core/runtime.ts';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log('VeritasAgent V3 (Deterministic Runtime)');
  console.log('---------------------------------------');

  // Initialize components
  const audit = new AuditLog('agent_v3.db');

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
  const llmUrl = 'http://localhost:8080/completion'; // Default llama.cpp port

  const runtime = new AgentRuntime(audit, mcp, llmUrl);

  while (true) {
    const user = await rl.question('\n> ');
    if (user.toLowerCase() === 'exit') break;

    try {
      const answer = await runtime.run(user);
      console.log('\nFinal:', answer);
    } catch (err: any) {
      console.error('\n❌ Error:', err.message);
    }
  }

  mcp.close();
  audit.close();
  rl.close();
}

main().catch(console.error);
