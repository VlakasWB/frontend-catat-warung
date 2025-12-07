# syntax=docker/dockerfile:1
FROM node:lts-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
WORKDIR /app
RUN corepack enable

# Install dependencies only for the frontend workspace
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
RUN pnpm install --filter frontend --frozen-lockfile=false

# Build the SvelteKit app
FROM deps AS build
COPY frontend ./frontend
RUN pnpm --filter frontend build

# Runtime image
FROM node:lts-alpine AS runtime
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app/frontend
RUN corepack enable

# Carry over workspace metadata and dependencies
COPY package.json pnpm-workspace.yaml /app/
COPY --from=build /app/node_modules /app/node_modules

# Copy built output and sources needed for preview server
COPY --from=build /app/frontend/.svelte-kit ./.svelte-kit
COPY --from=build /app/frontend/build ./build
COPY --from=build /app/frontend/package.json ./package.json
COPY --from=build /app/frontend/vite.config.ts ./vite.config.ts
COPY --from=build /app/frontend/svelte.config.js ./svelte.config.js
COPY --from=build /app/frontend/tsconfig.json ./tsconfig.json
COPY --from=build /app/frontend/postcss.config.cjs ./postcss.config.cjs
COPY --from=build /app/frontend/tailwind.config.cjs ./tailwind.config.cjs
COPY --from=build /app/frontend/src ./src

EXPOSE 3000

CMD ["pnpm", "--dir", "/app/frontend", "preview", "--host", "0.0.0.0", "--port", "3000"]
