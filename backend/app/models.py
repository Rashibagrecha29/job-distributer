from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="projects")
    queues = relationship("Queue", back_populates="project", cascade="all, delete-orphan")


class RetryPolicy(Base):
    __tablename__ = "retry_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    strategy = Column(String, nullable=False, default="fixed")
    delay_seconds = Column(Integer, nullable=False, default=30)
    max_retries = Column(Integer, nullable=False, default=3)
    backoff_multiplier = Column(Integer, nullable=False, default=2)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    queues = relationship("Queue", back_populates="retry_policy")


class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    priority = Column(Integer, nullable=False, default=5)
    concurrency_limit = Column(Integer, nullable=False, default=1)
    paused = Column(Boolean, default=False)
    retry_policy_id = Column(Integer, ForeignKey("retry_policies.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="queues")
    retry_policy = relationship("RetryPolicy", back_populates="queues")
    jobs = relationship("Job", back_populates="queue", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    job_type = Column(String, nullable=False, default="immediate")
    payload = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="queued")
    priority = Column(Integer, nullable=False, default=5)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    scheduled_at = Column(DateTime, nullable=True)
    delay_seconds = Column(Integer, nullable=False, default=0)
    recurrence_rule = Column(String, nullable=True)
    batch_size = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True, index=True)

    queue = relationship("Queue", back_populates="jobs")
    worker = relationship("Worker", back_populates="jobs")
    executions = relationship("JobExecution", back_populates="job", cascade="all, delete-orphan")
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")
    dead_letter = relationship("DeadLetterQueue", back_populates="job", cascade="all, delete-orphan", uselist=False)


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="idle")
    current_job_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_heartbeat_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="workers")
    jobs = relationship("Job", back_populates="worker")
    heartbeats = relationship("WorkerHeartbeat", back_populates="worker", cascade="all, delete-orphan")
    executions = relationship("JobExecution", back_populates="worker", cascade="all, delete-orphan")
    logs = relationship("JobLog", back_populates="worker", cascade="all, delete-orphan")


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    heartbeat_at = Column(DateTime, server_default=func.now(), nullable=False)
    details = Column(Text, nullable=True)

    worker = relationship("Worker", back_populates="heartbeats")


class JobExecution(Base):
    __tablename__ = "job_executions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="running")
    retry_count = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    job = relationship("Job", back_populates="executions")
    worker = relationship("Worker", back_populates="executions")


class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    event = Column(String, nullable=False)
    message = Column(Text, nullable=True)

    job = relationship("Job", back_populates="logs")
    worker = relationship("Worker", back_populates="logs")


class DeadLetterQueue(Base):
    __tablename__ = "dead_letter_queue"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True, unique=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    job = relationship("Job", back_populates="dead_letter")
