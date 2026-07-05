import threading
import time
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Job, JobExecution, JobLog, User, Worker


class WorkerService:
    def __init__(self):
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self):
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(target=self.run, daemon=True)
            self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)

    def run(self):
        while not self._stop_event.is_set():
            self.process_pending_jobs()
            time.sleep(2)

    def process_pending_jobs(self):
        db: Session = SessionLocal()
        try:
            jobs = db.query(Job).filter(Job.status.in_(["queued", "scheduled"])).order_by(Job.id.asc()).limit(10).all()
            for job in jobs:
                if self._stop_event.is_set():
                    break
                worker = self._ensure_worker(db, job)
                if not worker:
                    continue
                self.claim_job(db, worker, job)
                self.execute_job(db, worker, job)
        finally:
            db.close()

    def _ensure_worker(self, db: Session, job: Job) -> Optional[Worker]:
        user = db.query(User).order_by(User.id.asc()).first()
        if not user:
            return None
        worker = db.query(Worker).filter(Worker.user_id == user.id).order_by(Worker.id.asc()).first()
        if not worker:
            worker = Worker(user_id=user.id, name="default-worker", status="idle")
            db.add(worker)
            db.commit()
            db.refresh(worker)
        return worker

    def claim_job(self, db: Session, worker: Worker, job: Job):
        if job.status in ["queued", "scheduled"]:
            job.status = "claimed"
            job.worker_id = worker.id
            worker.status = "busy"
            db.add(JobLog(job_id=job.id, worker_id=worker.id, event="claimed", message="Job claimed by worker"))
            db.commit()

    def execute_job(self, db: Session, worker: Worker, job: Job):
        job.status = "running"
        job.started_at = datetime.utcnow()
        db.add(JobExecution(job_id=job.id, worker_id=worker.id, started_at=job.started_at, status="running", retry_count=job.retry_count))
        db.add(JobLog(job_id=job.id, worker_id=worker.id, event="running", message="Job started"))
        db.commit()

        time.sleep(1)

        job.status = "completed"
        job.finished_at = datetime.utcnow()
        worker.status = "idle"
        db.add(JobLog(job_id=job.id, worker_id=worker.id, event="completed", message="Job completed"))
        db.commit()


service = WorkerService()
