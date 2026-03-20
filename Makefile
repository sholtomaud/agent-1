IMAGE_NAME     = veritas-agent
CONTAINER_NAME = veritas-agent-app
PORT           = 3000
DATA_DIR       = $(abspath data)

.PHONY: all start build run stop clean logs shell test

# Default target: build and run
all: run

# ─── 1. System Lifecycle ──────────────────────────────────────────
# Ensures the container daemon is running.
# The '|| true' prevents it from failing if already running.
start:
	@echo "🔌 Checking container system service..."
	@container system start 2>/dev/null || true
	@# Sleep briefly to let the socket initialize if it was just started
	@sleep 1

# ─── 2. Build ─────────────────────────────────────────────────────
# Depends on 'start' to ensure the daemon is ready.
build: start
	@echo "🔨 Building VeritasAgent (Node 25 Native)..."
	container build -t "$(IMAGE_NAME)" .

# ─── 3. Run ───────────────────────────────────────────────────────
# Depends on 'build' so you never try to run a missing image.
run: build
	@mkdir -p "$(DATA_DIR)"
	@echo "🚀 Launching VeritasAgent on http://localhost:$(PORT)"

	@# Stop/Remove existing container (ignore errors if not exists)
	-container stop "$(CONTAINER_NAME)" >/dev/null 2>&1 || true
	-container rm "$(CONTAINER_NAME)" >/dev/null 2>&1 || true

	@# Run detached
	container run --detach --name "$(CONTAINER_NAME)" \
		--volume "$(DATA_DIR):/data" \
		--publish $(PORT):$(PORT) \
		--env DB_PATH=/data/agent_v3.db \
		--env MODE=server \
		"$(IMAGE_NAME)"

	@echo "✅ App is running."
	@echo "📋 Tailing logs (Press Ctrl+C to stop watching logs, App will keep running)..."
	@echo ""
	@container logs --follow "$(CONTAINER_NAME)"

# ─── 4. Utilities ─────────────────────────────────────────────────
stop:
	@echo "🛑 Stopping VeritasAgent..."
	-container stop "$(CONTAINER_NAME)"
	-container rm "$(CONTAINER_NAME)"

clean: stop
	@echo "🧹 Removing image..."
	-container rmi "$(IMAGE_NAME)"

logs:
	container logs --follow "$(CONTAINER_NAME)"

shell:
	container exec -it "$(CONTAINER_NAME)" /bin/sh

test: build
	@echo "🧪 Running tests inside container..."
	container run --rm "$(IMAGE_NAME)" node --test --experimental-strip-types tests/*.test.ts
