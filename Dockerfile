# ─── Kythia SaaS v2.0 — Dockerfile ───────────────────────────────
FROM node:20-alpine AS base

# System deps for canvas + native modules
RUN apk add --no-cache \
    python3 make g++ \
    cairo-dev pango-dev libjpeg-turbo-dev giflib-dev \
    pkgconfig

WORKDIR /app

# ─── Dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Production image ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 kythia \
 && adduser  --system --uid 1001 kythia
USER kythia

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["node", "src/index.js"]
