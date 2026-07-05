from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, Queue, RetryPolicy, User
from app.routes.auth import get_current_user_from_token
from app.schemas import QueueCreate, QueueOut, QueueUpdate

router = APIRouter(prefix="/projects/{project_id}/queues", tags=["queues"])


@router.get("", response_model=list[QueueOut])
def list_queues(project_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Queue).filter(Queue.project_id == project.id).order_by(Queue.id.desc()).all()


@router.post("", response_model=QueueOut, status_code=status.HTTP_201_CREATED)
def create_queue(project_id: int, payload: QueueCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    policy = None
    if payload.retry_policy_id is not None:
        policy = db.query(RetryPolicy).filter(RetryPolicy.id == payload.retry_policy_id).first()
        if not policy:
            raise HTTPException(status_code=404, detail="Retry policy not found")

    queue = Queue(
        project_id=project.id,
        name=payload.name,
        priority=payload.priority,
        concurrency_limit=payload.concurrency_limit,
        paused=payload.paused,
        retry_policy_id=payload.retry_policy_id,
    )
    db.add(queue)
    db.commit()
    db.refresh(queue)
    return queue


@router.put("/{queue_id}", response_model=QueueOut)
def update_queue(project_id: int, queue_id: int, payload: QueueUpdate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    queue.name = payload.name
    queue.priority = payload.priority
    queue.concurrency_limit = payload.concurrency_limit
    queue.paused = payload.paused
    queue.retry_policy_id = payload.retry_policy_id
    db.commit()
    db.refresh(queue)
    return queue


@router.delete("/{queue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_queue(project_id: int, queue_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    db.delete(queue)
    db.commit()
    return None
