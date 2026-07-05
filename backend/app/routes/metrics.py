from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Job, Project, Queue, User
from app.routes.auth import get_current_user_from_token
from app.schemas import MetricsOut

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=MetricsOut)
def get_metrics(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project_count = db.query(Project).filter(Project.owner_id == current_user.id).count()
    queue_count = db.query(Queue).join(Project).filter(Project.owner_id == current_user.id).count()
    job_count = db.query(Job).join(Queue).join(Project).filter(Project.owner_id == current_user.id).count()
    completed_jobs = db.query(Job).join(Queue).join(Project).filter(Project.owner_id == current_user.id, Job.status == "completed").count()
    failed_jobs = db.query(Job).join(Queue).join(Project).filter(Project.owner_id == current_user.id, Job.status == "failed").count()
    return {
        "project_count": project_count,
        "queue_count": queue_count,
        "job_count": job_count,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
    }
