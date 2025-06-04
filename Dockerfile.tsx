
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package.json package-lock.json* ./
RUN npm install

# Copy frontend source files
COPY index.html index.tsx App.tsx metadata.json ./
COPY components ./components

# Build frontend
# The build script (npm run build:frontend) creates dist_frontend and copies files into it.
# Ensure dist_frontend directory exists before cp commands in script, esbuild might create it for bundle.js
RUN mkdir -p dist_frontend
RUN npm run build:frontend

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend

# Install backend dependencies (including dev for tsc)
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --include=dev

# Copy backend source files
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build backend (tsc creates ./dist)
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy backend package.json and install only production dependencies
# Assumes backend/package-lock.json exists for `npm ci`
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

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
