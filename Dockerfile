# =========================
# Builder Stage
# =========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dev dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# =========================
# Production Stage
# =========================
FROM node:20-alpine AS production

# Install minimal required tools + fonts
RUN apk add --no-cache postgresql-client redis ffmpeg \
    freetype fontconfig ttf-dejavu

# Ensure a consistent font path for FFmpeg
RUN mkdir -p /usr/share/fonts/truetype/dejavu \
    && ln -s /usr/share/fonts/TTF/DejaVuSans-Bold.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

# Create app user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy scripts and environment example
COPY scripts/ ./scripts/
COPY env.example .env
RUN chmod +x ./scripts/*.sh


# Create outputs folder and give ownership to nestjs user
RUN mkdir -p /app/outputs \
    && chown -R nestjs:nodejs /app/outputs

# Set ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["./scripts/start-app.sh"]
