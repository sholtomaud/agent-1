# VeritasAgent

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

### Configuration

The agent can be configured using environment variables:

- `LLM_URL`: The URL of the LLM server (default: `http://localhost:8080/completion`).
- `DB_PATH`: The path to the SQLite audit log (default: `agent_v3.db`).
- `MODE`: Set to `server` to enable the REST API, or `cli` for the interactive mode (default: `cli`).
- `PORT`: The port for the REST API (default: `3000`).

### Usage (Local)

```bash
node --experimental-strip-types src/index.ts
```

### Running Tests (Local)

```bash
node --test --experimental-strip-types tests/*.test.ts
```

### Containerization (Apple Container)

VeritasAgent is designed to run in Apple containers for isolation. A `Makefile` is provided for convenience.

#### Prerequisites

- Apple `container` CLI installed and configured.

#### Getting Started with Containers

1. **Build and Run**:
   ```bash
   make run
   ```
   This will build the image, start the container in `server` mode, and tail the logs.

2. **Run Tests in Container (TDD)**:
   ```bash
   make test
   ```

3. **Stop and Clean**:
   ```bash
   make stop
   make clean
   ```

4. **Accessing the Server**:
   When running in server mode, you can interact with the agent via POST requests to `/chat`:
   ```bash
   curl -X POST http://localhost:3000/chat -d '{"message": "Add 5 and 10"}'
   ```

5. **Connecting to External LLM**:
   To connect the containerized agent to a `llama.cpp` server (or any compatible LLM server) running on your host machine, you must provide the `LLM_URL` using your host's network IP address (e.g., `http://192.168.1.5:8080/completion`). Note that `localhost` inside the container refers to the container itself, not your host machine.

   You can override the default `LLM_URL` when running `make`:
   ```bash
   LLM_URL="http://192.168.1.5:8080/completion" make run
   ```

   > **Tip**: To find your host's network IP on macOS, run:
   > ```bash
   > ipconfig getifaddr en0
   > ```

## Built-in Tools

- `sqlite_query`: Executes a SQL query against the local database.
- `add`: A simple mathematical tool for demonstration.

## Documentation

- [Functional Requirements](./REQUIREMENTS.MD)
- [Agent Instructions](./AGENTS.MD)
- [Roadmap / TODO](./TODO.MD)
