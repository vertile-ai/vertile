from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
import uuid

from app.core.db import Base


class DatasetFile(Base):
    """SQLAlchemy model for dataset files."""

    __tablename__ = "dataset_files"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    contentType = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    path = Column(String, nullable=False)
    uploadedAt = Column(DateTime(timezone=True), server_default=func.now())
