#!/bin/sh
set -e

# Check if ffmpeg exists
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ERROR: ffmpeg is not installed. Please install ffmpeg to run this app."
  exit 1
fi

echo "ffmpeg is installed. Continuing startup..."

# Start the main app
echo "Running migrations..."
npm run migration:run:prod

echo "Starting app..."
node dist/main
