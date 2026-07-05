from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Job, Project, Queue, RetryPolicy, User
from app.routes.auth import get_current_user_from_token
from app.schemas import RetryPolicyCreate, RetryPolicyOut

router = APIRouter(prefix="/retry-policies", tags=["retry"])


@router.get("", response_model=list[RetryPolicyOut])
def list_retry_policies(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    return db.query(RetryPolicy).all()


@router.post("", response_model=RetryPolicyOut, status_code=201)
def create_retry_policy(payload: RetryPolicyCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    policy = RetryPolicy(
        name=payload.name,
        strategy=payload.strategy,
        delay_seconds=payload.delay_seconds,
        max_retries=payload.max_retries,
        backoff_multiplier=payload.backoff_multiplier,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.post("/{policy_id}/apply", response_model=RetryPolicyOut)
def apply_retry_policy(policy_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    policy = db.query(RetryPolicy).filter(RetryPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Retry policy not found")
    return policy
