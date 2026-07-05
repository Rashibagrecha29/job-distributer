from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Worker, WorkerHeartbeat
from app.routes.auth import get_current_user_from_token
from app.schemas import WorkerCreate, WorkerHeartbeatCreate, WorkerOut

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("", response_model=list[WorkerOut])
def list_workers(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    return db.query(Worker).filter(Worker.user_id == current_user.id).order_by(Worker.id.desc()).all()


@router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(payload: WorkerCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    worker = Worker(user_id=current_user.id, name=payload.name, status="idle")
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/{worker_id}/heartbeat", response_model=WorkerOut)
def send_heartbeat(worker_id: int, payload: WorkerHeartbeatCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker.status = payload.status
    worker.last_heartbeat_at = payload.heartbeat_at
    db.add(WorkerHeartbeat(worker_id=worker.id, details=payload.details))
    db.commit()
    db.refresh(worker)
    return worker
