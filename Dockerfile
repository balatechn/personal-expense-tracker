FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .
RUN cd client && ./node_modules/.bin/vite build

# ── Production image ─────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev && apk del python3 make g++

COPY --from=builder /app/client/dist ./client/dist
COPY server ./server

RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
