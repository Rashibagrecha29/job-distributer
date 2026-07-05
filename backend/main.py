from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import User  # noqa: F401
from app.routes.auth import router as auth_router
from app.routes.dead_letter import router as dead_letter_router
from app.routes.jobs import router as jobs_router
from app.routes.logs import router as logs_router
from app.routes.metrics import router as metrics_router
from app.routes.projects import router as projects_router
from app.routes.queues import router as queues_router
from app.routes.retry import router as retry_router
from app.routes.workers import router as workers_router
from app.worker_service import service

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
service.start()

app = FastAPI(title="Job Distributor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(projects_router)
app.include_router(queues_router)
app.include_router(jobs_router)
app.include_router(workers_router)
app.include_router(metrics_router)
app.include_router(retry_router)
app.include_router(logs_router)
app.include_router(dead_letter_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
