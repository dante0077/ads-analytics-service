#!/bin/bash

echo "Starting migration process..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready! Running migrations..."

# Run migrations
npm run migration:run

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi