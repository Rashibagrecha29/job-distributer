from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DeadLetterQueue, Job, Project, Queue, User
from app.routes.auth import get_current_user_from_token
from app.schemas import DeadLetterOut

router = APIRouter(prefix="/dead-letter", tags=["dead-letter"])


@router.get("", response_model=list[DeadLetterOut])
def list_dead_letters(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    return (
        db.query(DeadLetterQueue)
        .join(Job)
        .join(Queue)
        .join(Project)
        .filter(Project.owner_id == current_user.id)
        .order_by(DeadLetterQueue.id.desc())
        .all()
    )


@router.post("/{dead_letter_id}/retry")
def retry_dead_letter(dead_letter_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    item = db.query(DeadLetterQueue).filter(DeadLetterQueue.id == dead_letter_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dead letter entry not found")
    item.job.status = "queued"
    db.delete(item)
    db.commit()
    return {"message": "Job retried from dead letter queue"}
