# Design Decisions

## 1. Backend Framework
FastAPI was chosen because it provides a fast developer experience, built-in validation, and clean async-friendly APIs.

## 2. Persistence Layer
SQLite was selected for a lightweight MVP because it keeps setup simple and works well for local development and demo environments.

## 3. Authentication
JWT-based authentication was implemented to protect routes and demonstrate a realistic admin-style workflow.

## 4. Frontend Structure
React + Vite + Tailwind were chosen to build a responsive admin dashboard with minimal setup overhead.

## 5. Worker Simulation
The current worker service is intentionally lightweight to support the demo experience without introducing the complexity of a full broker-based system.

## 6. Future Improvements
The next iteration would add a real message queue, background worker scaling, observability dashboards, and deployment automation.
