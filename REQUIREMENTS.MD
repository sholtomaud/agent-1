# VeritasAgent Functional Requirements

Deterministic Agent Runtime (V3) with LLM as planner, constrained execution, and cryptographic auditability.

## MoSCoW Prioritization

### Must Have (v2+)
- **Multi-step Planning Loop**: LLM produces a plan, executes a tool, receives results, and repeats until a final answer is reached.
- **Native Node.js (v25+)**: No 3rd party dependencies (zero npm/bun deps). Use `node:sqlite`, `node:test`, `fetch`, etc.
- **TypeScript Support**: Native execution using `--experimental-strip-types`.
- **Local MCP via stdio**: Communication with tools over standard I/O using JSON-RPC.
- **Streaming LLM Support**: Early tool detection from streaming LLM output (e.g., llama.cpp server).
- **Deterministic Audit Log**: Use `node:sqlite` to log every step, tool call, and result.
- **Schema Validation**: Hard validation boundary for tool calls before execution.
- **Retry Logic**: Automatic retry for invalid LLM tool call formatting.

### Should Have (v3)
- **Cryptographic Integrity**: SHA-256 hash chaining of audit logs to detect tampering.
- **Tool Sandboxing**: Isolated execution environment for tools (e.g., WASM or read-only database access).
- **Timeout & Kill Switch**: Automatic termination of hung MCP tool processes.
- **Strict JSON Schema**: Formal validation per tool.

### Could Have
- **Merkle-chain Audit Log**: Advanced data structure for verifiable execution.
- **Deterministic Replay**: Ability to replay the agent's actions from the audit log to verify results.
- **Signed Tool Outputs**: Tools sign their results for end-to-end verifiability.

### Won't Have (For Now)
- **Web UI**: This is a CLI/Runtime core.
- **Support for non-native libraries**: No `axios`, `zod`, etc.
