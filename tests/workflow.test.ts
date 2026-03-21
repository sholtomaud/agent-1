import { AgentRuntime } from '../src/core/runtime.ts';
import { AuditLog } from '../src/core/audit.ts';
import { MCPClient } from '../src/core/mcp.ts';
import { TDDWorkflow, TDDPhase } from '../src/core/workflow.ts';
import assert from 'node:assert';
import { test, describe, before, after } from 'node:test';
import fs from 'node:fs';

// Mock streamLLM to simulate different phases
async function mockStreamLLM(url: string, prompt: string): Promise<string> {
  if (prompt.includes('Phase: Decompose')) {
    return 'I will decompose this into sub-tasks.';
  }
  if (prompt.includes('Phase: Define Tests')) {
    return JSON.stringify({
      tool: 'vfs_tool',
      args: { action: 'writeFile', path: '/sandbox/test.test.ts', content: 'test content' }
    });
  }
  if (prompt.includes('Phase: Define Code')) {
    return JSON.stringify({
      tool: 'vfs_tool',
      args: { action: 'writeFile', path: '/sandbox/code.ts', content: 'code content' }
    });
  }
  if (prompt.includes('Phase: Run Tests')) {
    return JSON.stringify({
      tool: 'test_runner_tool',
      args: { testPath: '/sandbox/test.test.ts' }
    });
  }
  // To reach Complete, RunTests needs to return something that doesn't include 'failed' or 'error'
  // But wait, AgentRuntime returns the tool result to the LLM, and THEN it returns the final answer.
  // Our workflow calls runtime.run(prompt).
  // If the LLM generates a tool call, AgentRuntime executes it and loops.
  // We need to simulate the LLM giving a FINAL ANSWER after the tool call.

  if (prompt.includes('Tool result:')) {
     if (prompt.includes('test_runner_tool')) {
        return 'Tests passed successfully.';
     }
     return 'Action completed.';
  }

  return 'Final response';
}

// We need to override the imported streamLLM in runtime.ts or provide a way to inject it.
// Since we can't easily inject it into the class without changing the class,
// let's just test the workflow logic by mocking the runtime.

describe('TDDWorkflow', () => {
  test('should step through phases', async () => {
    const dbPath = 'test_workflow.db';
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const audit = new AuditLog(dbPath);
    const mcp = new MCPClient('node', ['tool.js']); // tool.js must exist, but we might not use it if we mock runtime
    const runtime = new AgentRuntime(audit, mcp, 'http://mock');

    // Mocking runtime.run
    let runCount = 0;
    runtime.run = async (prompt: string) => {
        runCount++;
        if (prompt.includes('Phase: Decompose')) return 'Decomposed';
        if (prompt.includes('Phase: Define Tests')) return 'Tests Defined';
        if (prompt.includes('Phase: Define Code')) return 'Code Defined';
        if (prompt.includes('Phase: Run Tests')) return 'Tests Passed';
        return 'Done';
    };

    const workflow = new TDDWorkflow(runtime, { issue_id: '123', feature_name: 'test' });
    const result = await workflow.run('Implement a calculator');

    assert.ok(result.includes('Complete'));
    assert.ok(runCount >= 4);

    audit.close();
    mcp.close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  test('should loop back on failure', async () => {
    const dbPath = 'test_workflow_fail.db';
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const audit = new AuditLog(dbPath);
    const mcp = new MCPClient('node', ['tool.js']);
    const runtime = new AgentRuntime(audit, mcp, 'http://mock');

    let runCount = 0;
    let failedOnce = false;

    runtime.run = async (prompt: string) => {
        runCount++;
        if (prompt.includes('Phase: Decompose')) return 'Decomposed';
        if (prompt.includes('Phase: Define Tests')) return 'Tests Defined';
        if (prompt.includes('Phase: Define Code')) return 'Code Defined';
        if (prompt.includes('Phase: Run Tests')) {
            if (!failedOnce) {
                failedOnce = true;
                return 'Tests Failed';
            }
            return 'Tests Passed';
        }
        if (prompt.includes('Phase: Check Errors')) return 'Checked Errors';
        if (prompt.includes('Phase: Fix/Research')) return 'Fixed';
        return 'Done';
    };

    const workflow = new TDDWorkflow(runtime, { issue_id: '123', feature_name: 'test' });
    const result = await workflow.run('Implement a calculator');

    assert.ok(result.includes('Complete'));
    // Decompose -> DefineTests -> DefineCode -> RunTests(Fail) -> CheckErrors -> FixResearch -> DefineCode -> RunTests(Pass) -> Complete
    // 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 = 8 runs
    assert.strictEqual(runCount, 8);

    audit.close();
    mcp.close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });
});
