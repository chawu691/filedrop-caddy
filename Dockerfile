
# Stage 1: Build Frontend
FROM dockerpull.pw/node:lts-alpine3.22 AS frontend-builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package.json package-lock.json* ./
RUN npm install

# Copy frontend source files
COPY index.html index.tsx App.tsx metadata.json ./
COPY components ./components

# Build frontend
# Create dist_frontend directory and build both JS and copy HTML files
RUN mkdir -p dist_frontend
RUN npm run build:frontend
RUN npm run copy:frontend

# Stage 2: Build Backend
FROM dockerpull.pw/node:lts-alpine3.22 AS backend-builder
WORKDIR /app/backend

# Install build dependencies for native modules (sqlite3)
# Add py3-setuptools to fix distutils issue
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++ sqlite-dev

# Install backend dependencies (including dev for tsc)
COPY backend/package.json backend/package-lock.json* ./
# Set environment variables for sqlite3 compilation
ENV PYTHON=/usr/bin/python3
ENV npm_config_build_from_source=true
RUN npm install --include=dev

# Copy backend source files
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build backend (tsc creates ./dist)
RUN npm run build

# Stage 3: Production Image
FROM dockerpull.pw/node:lts-alpine3.22
ENV NODE_ENV=production
WORKDIR /app

# Install runtime dependencies for sqlite3 and health checks
RUN apk add --no-cache wget sqlite

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy backend package.json and package-lock.json from the backend-builder stage
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/package-lock.json ./backend/package-lock.json

# Copy the already built node_modules from backend-builder to avoid rebuilding sqlite3
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy built backend from backend-builder stage
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist_frontend ./dist_frontend

# Create directories for uploads and database within the backend directory
# These paths align with how server.ts calculates them (e.g., path.join(__dirname, '..', 'uploads'))
# Grant ownership to the appuser
RUN mkdir -p backend/uploads backend/database && \
    chown -R appuser:appgroup backend/uploads backend/database

# Set ownership of the entire app directory to the appuser
# This is beneficial if the app needs to write other temp files or logs not covered by uploads/database.
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port (default 3001, can be overridden via ENV PORT)
EXPOSE 3001
ENV PORT 3001

# Command to run the backend server
# __dirname in server.js will be /app/backend/dist
CMD ["node", "backend/dist/server.js"]
