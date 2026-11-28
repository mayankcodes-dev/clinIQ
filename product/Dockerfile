# ── ClinIQ — Dockerfile ──────────────────────────────────────────────────────
# Multi-stage build: install → build (standalone) → slim runtime image.
# The app runs in Next.js standalone mode on port 3000.
# All AI features gracefully degrade when API keys are absent.
#
# Quick start:
#   docker compose up           (uses docker-compose.yml)
#   docker build -t cliniq .    (manual build)
#   docker run -p 3000:3000 cliniq
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── 1. Dependency install ─────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── 2. Build (standalone output for Docker) ───────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Enable standalone output — next.config.ts reads this env var
ENV NEXT_OUTPUT=standalone
# Provide minimal public env vars so the build succeeds without secrets
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_VERSION=1.0.0
ENV GEMINI_MODEL=gemini-2.5-flash

RUN npm run build

# ── 3. Slim runtime image ─────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check — polls the lightweight /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
