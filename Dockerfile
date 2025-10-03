# Multi-stage Dockerfile for Angular Pomodoro PWA

# ================================
# Stage 1: Builder
# ================================
FROM node:22-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with frozen lockfile
RUN npm ci --prefer-offline --no-audit

# Copy application source
COPY . .

# Build for production
RUN npm run build -- --configuration=production

# ================================
# Stage 2: Runtime (Nginx)
# ================================
FROM nginx:1.27-bookworm AS runtime

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist/pomodoro-app/browser /usr/share/nginx/html

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
