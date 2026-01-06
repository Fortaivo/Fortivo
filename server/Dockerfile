# Development Dockerfile - optimized for hot reload with volume mounts
FROM node:20-bullseye-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i; \
    elif [ -f yarn.lock ]; then yarn; \
    elif [ -f package-lock.json ]; then npm ci; else npm i; fi

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Source code will be mounted as volume in docker-compose
# This allows hot reload without rebuilding

EXPOSE 8080

# Run migrations and start dev server with hot reload
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]


