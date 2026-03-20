# AGENTS.MD - AI Developer Instructions

For future AI agents working on VeritasAgent:

## Core Principles

- **Native Only**: Do not add any 3rd party dependencies. All code must use Node.js built-in modules only (e.g., `node:sqlite`, `node:child_process`, `node:test`, `node:crypto`). **Exception: `zod` is allowed for schema validation.**
- **TypeScript Support**: Use `.ts` files and ensure they run with `node --experimental-strip-types`. Do not use `tsc` for compilation or build steps.
- **Deterministic & Auditable**: Every tool call and significant agent action must be logged in the `audit` table in SQLite.
- **TDD (Test-Driven Development)**: Write tests in the `tests/` directory using the native `node:test` runner. All new features must have test coverage.
- **Security First**: Ensure tool inputs are validated and that execution environments are controlled.

## Project Structure

- `src/core/`: Core runtime logic, audit logs, and communication.
- `src/tools/`: Implementation of built-in tools.
- `tests/`: Native Node.js tests for all components.

## Development Workflow

1.  Add new requirements to `REQUIREMENTS.MD`.
2.  Write tests for the new feature in `tests/`.
3.  Implement the feature in `src/`.
4.  Run tests: `node --test tests/*.test.ts` (with `--experimental-strip-types`).
5.  Update `TODO.MD` and `README.md` if necessary.

## Gotchas

- **SQLite is Experimental**: Always use the correct experimental flags or check for `DatabaseSync` availability.
- **No NPM**: Do not create a `package.json` with dependencies unless it's strictly for metadata. **Exception: `zod` is allowed.**
- **Streaming LLM**: The `streamLLM` function expects a standard llama.cpp response format. Mock it for testing if a real server is unavailable.
