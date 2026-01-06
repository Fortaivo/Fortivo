# Development Dockerfile - optimized for hot reload with volume mounts
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i; \
    elif [ -f yarn.lock ]; then yarn; \
    elif [ -f package-lock.json ]; then npm ci; else npm i; fi

# Source code, config files, and public assets will be mounted as volumes
# This allows hot reload without rebuilding the image

EXPOSE 5173

# Start Vite dev server with hot module replacement
CMD ["npm", "run", "dev", "--", "--host"]


