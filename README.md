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
- Apple `container` CLI (if running in a container).
- A `llama.cpp` server running locally or accessible via network.

### LLM Server Setup (llama.cpp)

To use VeritasAgent, you need a compatible LLM server. We recommend `llama.cpp`.

1. **Download and Build llama.cpp**: Follow instructions at [github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp).
2. **Start the Server**:
   ```bash
   ./llama-server -m path/to/your/model.gguf --port 8080 --n-predict 512
   ```
   *Note: Ensure the server is listening on `0.0.0.0` if you plan to access it from a container.*

### Installation

No installation required! Just clone the repo and ensure you have the prerequisites.

### Configuration

The agent can be configured using environment variables:

- `LLM_URL`: The URL of the LLM server (default: `http://localhost:8080/completion`).
- `DB_PATH`: The path to the SQLite audit log (default: `agent_v3.db`).
- `MODE`: Set to `server` to enable the REST API, or `cli` for the interactive mode (default: `cli`).
- `PORT`: The port for the REST API (default: `3000`).

### Usage (Local)

Run the agent in interactive CLI mode:
```bash
node --experimental-strip-types src/index.ts
```

### Running Tests (Local)

```bash
node --test --experimental-strip-types tests/*.test.ts
```

### Containerization (Apple Container CLI)

VeritasAgent is designed to run in isolated environments using the Apple `container` CLI. A `Makefile` is provided to simplify management.

#### Getting Started with Containers

1. **Build and Run**:
   ```bash
   make run
   ```
   This command ensures the `container` system service is started, builds the image, and launches the container in `server` mode.

2. **Run Tests in Container**:
   ```bash
   make test
   ```

3. **Check Logs**:
   ```bash
   make logs
   ```

4. **Stop and Clean**:
   ```bash
   make clean
   ```

#### Connecting to Local llama.cpp from Container

When the agent runs inside a container, `localhost` refers to the container itself. To connect to a `llama.cpp` server running on your host machine:

1. **Find your Host IP**:
   On macOS, you can find your network IP using:
   ```bash
   ipconfig getifaddr en0
   ```
   (e.g., `192.168.1.5`)

2. **Run with LLM_URL**:
   Pass your host IP to the `make` command:
   ```bash
   LLM_URL="http://192.168.1.5:8080/completion" make run
   ```

## Built-in Tools

- `vfs_tool`: Virtual File System operations (read/write files).
- `test_runner_tool`: Executes tests and returns results.
- `sqlite_query`: Executes SQL queries (via internal MCP mock).

## Documentation

- [Functional Requirements](./REQUIREMENTS.MD)
- [Agent Instructions](./AGENTS.MD)
- [Roadmap / TODO](./TODO.MD)
