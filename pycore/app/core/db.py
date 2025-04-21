import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import URL

from app.core.config import settings

logger = logging.getLogger(__name__)

# Get database URL from environment or settings
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/vertile"
)

# Create SQLAlchemy engine
try:
    engine = create_engine(DATABASE_URL)
    logger.info(f"Database connection established")
except Exception as e:
    logger.error(f"Failed to connect to database: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Get database session.

    Yields:
        SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
