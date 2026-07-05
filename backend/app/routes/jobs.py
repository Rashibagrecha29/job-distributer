from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Job, Project, Queue, User
from app.routes.auth import get_current_user_from_token
from app.schemas import JobCreate, JobOut, JobUpdate

router = APIRouter(prefix="/projects/{project_id}/queues/{queue_id}/jobs", tags=["jobs"])


@router.get("", response_model=list[JobOut])
def list_jobs(project_id: int, queue_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return db.query(Job).filter(Job.queue_id == queue.id).order_by(Job.id.desc()).all()


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(project_id: int, queue_id: int, payload: JobCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    job = Job(
        queue_id=queue.id,
        name=payload.name,
        job_type=payload.job_type,
        payload=payload.payload,
        priority=payload.priority,
        retry_count=0,
        max_retries=payload.max_retries,
        scheduled_at=payload.scheduled_at,
        delay_seconds=payload.delay_seconds,
        recurrence_rule=payload.recurrence_rule,
        batch_size=payload.batch_size,
        status="queued" if payload.job_type != "scheduled" else "scheduled",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobOut)
def update_job(project_id: int, queue_id: int, job_id: int, payload: JobUpdate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    job = db.query(Job).filter(Job.id == job_id, Job.queue_id == queue.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = payload.status
    job.error_message = payload.error_message
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(project_id: int, queue_id: int, job_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    queue = db.query(Queue).filter(Queue.id == queue_id, Queue.project_id == project.id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    job = db.query(Job).filter(Job.id == job_id, Job.queue_id == queue.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return None
