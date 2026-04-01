FROM node:20-alpine

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production=false

COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .
RUN cd client && npx vite build

# Remove dev deps & build tools
RUN npm prune --production && apk del python3 make g++

# Persistent data directory
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/expenses.db
ENV JWT_SECRET=expense-tracker-prod-change-me

EXPOSE 3001

CMD ["node", "server/index.js"]
