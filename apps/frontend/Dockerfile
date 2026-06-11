FROM node:18-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace setup files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy app packages to bootstrap dependency structure
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies for the whole workspace
RUN pnpm install --frozen-lockfile

# Copy the rest of the workspace source code
COPY . .

# Declare build-time environment variables for Next.js compilation
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Build Next.js frontend
RUN pnpm --filter frontend build

EXPOSE 3000

CMD ["pnpm", "--filter", "frontend", "start"]
