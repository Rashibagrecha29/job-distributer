# API Documentation

## Authentication
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /auth/logout

## Projects
- GET /projects
- POST /projects
- GET /projects/{project_id}
- PUT /projects/{project_id}
- DELETE /projects/{project_id}

## Queues
- GET /projects/{project_id}/queues
- POST /projects/{project_id}/queues
- PUT /projects/{project_id}/queues/{queue_id}
- DELETE /projects/{project_id}/queues/{queue_id}

## Jobs
- GET /projects/{project_id}/queues/{queue_id}/jobs
- POST /projects/{project_id}/queues/{queue_id}/jobs
- PUT /projects/{project_id}/queues/{queue_id}/jobs/{job_id}
- DELETE /projects/{project_id}/queues/{queue_id}/jobs/{job_id}

## Workers
- GET /workers
- POST /workers
- POST /workers/{worker_id}/heartbeat

## Metrics and Ops
- GET /metrics
- GET /logs
- GET /dead-letter
- POST /dead-letter/{dead_letter_id}/retry

## Notes
All protected routes require a bearer token in the Authorization header.
