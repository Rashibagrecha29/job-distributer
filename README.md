# Job Distributor

Job Distributor is a full-stack admin dashboard for managing distributed background jobs. It is designed to look and feel like a real operations panel where you can create projects, organize queues, submit jobs, monitor workers, and inspect failures.

## What this app does
- Lets users register and log in securely with JWT authentication
- Organizes work into projects and queues
- Creates and tracks jobs through queued, claimed, running, completed, and failed states
- Shows dead-letter jobs and execution logs
- Provides a React-based admin dashboard for monitoring the workflow

## Tech stack
- Backend: FastAPI, SQLAlchemy, SQLite
- Frontend: React, Vite, Tailwind CSS
- Testing: Python unittest with FastAPI TestClient

## Project structure
- backend/: FastAPI application, routes, models, and worker service
- frontend/: React dashboard UI
- docs/: architecture, ER diagram, API docs, and design notes
- database/: SQLite database storage

## How the app works
1. The backend starts and creates the SQLite database if it does not already exist.
2. The frontend loads the login screen first.
3. After login, the app shows the dashboard with navigation for projects, queues, jobs, workers, analytics, logs, and dead-letter items.
4. The backend uses a lightweight worker service to process queued jobs and update their status.
5. Jobs can be monitored from the UI and through the API endpoints.

## Setup instructions

### 1. Prerequisites
Make sure you have:
- Python 3.9+ installed
- Node.js and npm installed

### 2. Backend setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Start the backend
```bash
cd backend
./.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at:
- http://127.0.0.1:8000
- API docs: http://127.0.0.1:8000/docs

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will usually open at:
- http://localhost:5173

### 5. Login and use the app
1. Open the frontend in your browser.
2. Register a new account or log in with an existing one.
3. After login, you will be taken to the dashboard.
4. Create a project, then create a queue under it, then add jobs to the queue.
5. The worker service will process the jobs in the background and update their status.

## Required things to make the app work
- A running backend server on port 8000
- A running frontend dev server on port 5173
- A valid login token for protected routes
- An internet connection is not required for local development

## Testing
Run the backend tests with:
```bash
cd backend
./.venv/bin/python -m unittest discover -s tests -v
```

## Demo user flow
Here is a simple example of how to use the app end to end:

1. Open the frontend at http://localhost:5173.
2. Click Register and create a new account.
3. Log in with that account.
4. On the dashboard, create a new Project such as "Invoice Processing".
5. Inside that project, create a Queue such as "Email Queue".
6. Add a Job to that queue with a name like "Send invoice email".
7. Watch the job move through the queue and update its status as the worker processes it.
8. Visit the Logs or Dead Letter pages to inspect execution activity and failures.

This flow shows the main purpose of the app: turning a simple background job system into a visible admin dashboard experience.

## API overview
The backend exposes routes for:
- Authentication: /auth/register, /auth/login, /auth/me, /auth/logout
- Projects: /projects
- Queues: /projects/{project_id}/queues
- Jobs: /projects/{project_id}/queues/{queue_id}/jobs
- Workers: /workers
- Metrics and operations: /metrics, /logs, /dead-letter

## Documentation
- [Architecture overview](docs/architecture.md)
- [ER diagram](docs/er-diagram.md)
- [API documentation](docs/api.md)
- [Design decisions](docs/design-decisions.md)

## Notes
The current version is intended for local development and internship/demo purposes. It uses SQLite and a lightweight worker simulation service rather than a production-grade distributed queue.
