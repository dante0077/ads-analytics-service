#!/bin/bash

echo "🚀 Starting Ads Analytics Service Infrastructure..."

# Function to check if docker-compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        echo "Using docker-compose"
        return 0
    elif docker compose version &> /dev/null; then
        echo "Using docker compose"
        return 1
    else
        echo "❌ Neither docker-compose nor docker compose found!"
        exit 1
    fi
}

# Choose the appropriate compose command
if check_docker_compose; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo "📦 Building and starting services..."

# Start infrastructure first
$COMPOSE_CMD up -d postgres redis

echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
$COMPOSE_CMD run --rm migration

# Start the application
echo "🚀 Starting the application..."
$COMPOSE_CMD up -d app

echo "✅ All services started!"
echo "🌐 Application available at: http://localhost:3000"
echo "📚 API Documentation available at: http://localhost:3000/api-docs"
echo ""
echo "To view logs: $COMPOSE_CMD logs -f app"
echo "To stop services: $COMPOSE_CMD down"