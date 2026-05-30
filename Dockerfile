FROM node:24-slim

WORKDIR /app

# Enable corepack (provides pnpm without global install)
RUN corepack enable

# Copy package manager files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib ./lib
COPY artifacts ./artifacts

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm run build

EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.js"]
