import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt

SECRET_KEY = "job-distributor-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_b64, hash_b64 = hashed_password.split("$", 1)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected_hash = base64.b64decode(hash_b64.encode("utf-8"))
        actual_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{base64.b64encode(salt).decode('utf-8')}${base64.b64encode(hashed).decode('utf-8')}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
