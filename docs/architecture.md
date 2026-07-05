# Architecture Overview

## System Context
Job Distributor is a full-stack application for managing distributed background jobs. The system combines a FastAPI backend, a React dashboard, and a SQLite-backed persistence layer.

## Components
- Frontend: React + Vite + Tailwind dashboard for monitoring projects, queues, jobs, workers, analytics, and failures.
- Backend: FastAPI REST API with authentication, CRUD endpoints, and a lightweight worker simulation service.
- Database: SQLite database stored in the repository database folder.

## Request Flow
1. A user authenticates through the frontend.
2. The frontend calls protected API routes using a JWT bearer token.
3. The backend validates the token and persists or retrieves data from SQLite.
4. A background worker service consumes queued jobs and updates their state.

## Deployment Notes
The current implementation is intended for local development and demo usage. In production, it would be extended with a real broker such as RabbitMQ or Kafka, a proper worker pool, and containerized deployment.
