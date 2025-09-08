# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
ENV npm_config_loglevel=warn npm_config_update_notifier=false
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- proddeps ----
FROM node:20-alpine AS proddeps
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8090
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nodeuser
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
USER nodeuser
EXPOSE 8090
CMD ["node", "dist/server.js"]