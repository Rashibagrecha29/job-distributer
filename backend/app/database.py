from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_DIR = Path(__file__).resolve().parents[1] / ".." / "database"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_DB = f"sqlite:///{DB_DIR / 'job_distributor.db'}"
engine = create_engine(SQLITE_DB, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
