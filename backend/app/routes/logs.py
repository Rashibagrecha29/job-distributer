from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Job, JobLog, Project, Queue, User
from app.routes.auth import get_current_user_from_token
from app.schemas import JobLogOut

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=list[JobLogOut])
def list_logs(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    return (
        db.query(JobLog)
        .join(Job)
        .join(Queue)
        .join(Project)
        .filter(Project.owner_id == current_user.id)
        .order_by(JobLog.id.desc())
        .all()
    )
