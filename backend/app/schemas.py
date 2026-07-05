from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    username: str

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int

    class Config:
        from_attributes = True


class QueueCreate(BaseModel):
    name: str
    priority: int = 5
    concurrency_limit: int = 1
    paused: bool = False
    retry_policy_id: Optional[int] = None


class QueueUpdate(BaseModel):
    name: str
    priority: int = 5
    concurrency_limit: int = 1
    paused: bool = False
    retry_policy_id: Optional[int] = None


class QueueOut(BaseModel):
    id: int
    project_id: int
    name: str
    priority: int
    concurrency_limit: int
    paused: bool
    retry_policy_id: Optional[int]

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    name: str
    job_type: str = "immediate"
    payload: Optional[str] = None
    priority: int = 5
    max_retries: int = 3
    scheduled_at: Optional[datetime] = None
    delay_seconds: int = 0
    recurrence_rule: Optional[str] = None
    batch_size: Optional[int] = None


class JobUpdate(BaseModel):
    status: str
    error_message: Optional[str] = None


class JobOut(BaseModel):
    id: int
    queue_id: int
    name: str
    job_type: str
    payload: Optional[str]
    status: str
    priority: int
    retry_count: int
    max_retries: int
    scheduled_at: Optional[datetime]
    delay_seconds: int
    recurrence_rule: Optional[str]
    batch_size: Optional[int]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class RetryPolicyCreate(BaseModel):
    name: str
    strategy: str = "fixed"
    delay_seconds: int = 30
    max_retries: int = 3
    backoff_multiplier: int = 2


class RetryPolicyOut(BaseModel):
    id: int
    name: str
    strategy: str
    delay_seconds: int
    max_retries: int
    backoff_multiplier: int

    class Config:
        from_attributes = True


class WorkerCreate(BaseModel):
    name: str


class WorkerHeartbeatCreate(BaseModel):
    status: str
    heartbeat_at: datetime
    details: Optional[str] = None


class WorkerOut(BaseModel):
    id: int
    user_id: int
    name: str
    status: str
    current_job_id: Optional[int]
    last_heartbeat_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobLogOut(BaseModel):
    id: int
    job_id: int
    worker_id: Optional[int]
    created_at: datetime
    event: str
    message: Optional[str]

    class Config:
        from_attributes = True


class DeadLetterOut(BaseModel):
    id: int
    job_id: int
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MetricsOut(BaseModel):
    project_count: int
    queue_count: int
    job_count: int
    completed_jobs: int
    failed_jobs: int
