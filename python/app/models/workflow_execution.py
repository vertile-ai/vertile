from sqlalchemy import Column, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.db import Base


class WorkflowExecution(Base):
    """SQLAlchemy model for workflow executions."""

    __tablename__ = "workflow_executions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflowId = Column(
        String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    snapshot = Column(
        JSON, nullable=False
    )  # The snapshot of the workflow at the time of execution
    status = Column(String, nullable=False)
    result = Column(JSON, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
