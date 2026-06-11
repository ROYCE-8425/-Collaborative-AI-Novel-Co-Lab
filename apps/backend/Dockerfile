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

# Build NestJS backend
RUN pnpm --filter backend build

EXPOSE 3001

CMD ["pnpm", "--filter", "backend", "start:prod"]
