# Ads Analytics Service

Backend service for video rendering and project management built with **NestJS**, **TypeORM (Postgres)**, **Redis**, and **FFmpeg**.
Jobs are processed asynchronously using **BullMQ**.

## Features

- Manage projects and video assets
- Enqueue and track video render jobs
- Supports video processing with FFmpeg (text overlay, compression, resolution options)
- Stores outputs temporarily and optionally uploads to S3
- Non-blocking architecture with queue health monitoring

## Requirements

- Docker & Docker Compose
- AWS credentials (for S3 uploads, optional) set as environment variables

## Setup & Run

1. **Configure environment**  
   Copy `env.example` and update values:

   ```bash
   cp env.example .env
   ```

   Add any required secrets like S3 access key, secret key, and bucket name.

2. **Start the application**

   ```bash
   docker-compose up
   ```

- The app will start with Postgres and Redis included.
- APIs are available immediately after the containers are up.
- Swagger UI: http://localhost:3000/api-docs

## API Overview

### Projects

- POST /projects – Create a project
- GET /projects – List all projects
- GET /projects/:id – Get project by ID
- POST /projects/:id/render – Enqueue a render job
- GET /projects/:id/render/:jobId – Track render job status
- GET /projects/health/queue – Check render queue health

### Assets

- POST /projects/{projectId}/assets – Upload an asset to a project
- GET /projects/{projectId}/assets – Get all assets for a project
- GET /projects/{projectId}/assets/{assetId} – Get asset by ID

### Jobs

- GET /jobs/{id} – Get job status by ID

### Analytics

- POST /analytics – Log an analytics event
- GET /analytics/project/{projectId} – Get analytics events for a project

## Notes

- All render outputs are stored in a temporary directory inside the container.
- Jobs are processed asynchronously using background workers.
- Ensure your .env contains all required configurations, including AWS S3 credentials if uploading rendered videos.
