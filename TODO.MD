# VeritasAgent TODO & Roadmap

## V3 Core (Current Focus)

- [x]  Implement `src/core/audit.ts` with SHA-256 hash chaining.
- [x]  Implement `src/core/mcp.ts` with stdio, JSON-RPC, and timeout/kill-switch.
- [x]  Implement `src/core/llm.ts` for streaming and tool detection.
- [x]  Implement `src/core/runtime.ts` with multi-step loop, schema validation, and retry logic.
- [x]  Set up `node:test` based TDD for each component.

## Future Enhancements (V4+)

- [ ]  Merkle-chain Audit Log: Advanced data structure for verifiable execution.
- [ ]  Tool Sandboxing: WASM or isolated read-only SQLite.
- [ ]  Deterministic Replay: Verify execution from audit logs.
- [ ]  Strict JSON Schema validation for all tool inputs.
- [ ]  Cryptographic signing of tool results.

## Optimization

- [ ]  Reduce latency by improving early tool detection.
- [ ]  Add support for more complex multi-turn conversation memory.
- [ ]  Improve error messages for LLM self-correction.
