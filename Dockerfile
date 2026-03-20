# ─────────────────────────────────────────────────────────────────
#  VeritasAgent
#  Node 25 Native TypeScript (No Build Step)
# ─────────────────────────────────────────────────────────────────

FROM node:25-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:25-bookworm-slim AS runtime

# Install SQLite3 dependencies (if not statically linked in node:sqlite)
# and generic system libs for stability
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r veritas && useradd -r -g veritas veritas
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY tests/ ./tests/

# Create data directory
RUN mkdir -p /data && chown -R veritas:veritas /data /app
USER veritas

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/agent_v3.db
ENV MODE=server

EXPOSE 3000

# Run TypeScript directly using Node's type stripping
CMD ["node", "--experimental-strip-types", "src/index.ts"]
