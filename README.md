# VeritasAgent (V3)

VeritasAgent is a deterministic, verifiable agent runtime designed for safety, reliability, and observability. It uses an LLM as a constrained planner and executes tools in a strictly controlled environment, logging every step with cryptographic integrity.

## Key Features

- **Deterministic Planning Loop**: Multi-step LLM-driven planning with tool execution.
- **Verifiable Audit Log**: All actions, results, and steps are logged in an append-only SQLite database with SHA-256 hash chaining for tamper detection.
- **Zero Dependencies**: Built entirely with native Node.js features (`node:sqlite`, `node:test`, `fetch`, etc.).
- **Native TypeScript Support**: Runs directly with `node --experimental-strip-types` (Node.js v25+).
- **Local MCP Integration**: Connects to tools over standard I/O via JSON-RPC.
- **Streaming & Early Detection**: Supports streaming LLM output with early tool call detection.
- **Reliability & Safety**: Built-in tool call validation, retries, and process timeouts.

## Architecture

1.  **Planner (LLM via streaming)**: Generates plans and tool calls.
2.  **Validator (Schema + Guards)**: Ensures tool calls follow expected formats before execution.
3.  **Tool Executor**: Manages both built-in (e.g., SQLite) and external (MCP stdio) tools.
4.  **Audit Log (SQLite)**: Persists all steps and enforces integrity with hash chains.
5.  **Runtime**: Orchestrates the loop, managing state and history.

## Getting Started

### Prerequisites

- Node.js v25+ (supports `node:sqlite` and `--experimental-strip-types`).
- A llama.cpp server or compatible HTTP LLM server running on `http://localhost:8080`.

### Installation

No installation required! Just clone the repo and run.

### Usage

```bash
node --experimental-strip-types src/index.ts
```

### Running Tests

```bash
node --test --experimental-strip-types tests/*.test.ts
```

## Built-in Tools

- `sqlite_query`: Executes a SQL query against the local database.
- `add`: A simple mathematical tool for demonstration.

## Documentation

- [Functional Requirements](./REQUIREMENTS.MD)
- [Agent Instructions](./AGENTS.MD)
- [Roadmap / TODO](./TODO.MD)
