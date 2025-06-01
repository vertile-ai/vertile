from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid

from app.core.db import Base


class WorkflowEdge(Base):
    """SQLAlchemy model for workflow edges."""

    __tablename__ = "workflow_edges"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflowId = Column(
        String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    data = Column(JSON, nullable=False)  # The custom edge data
    rawData = Column(JSON, nullable=False)
    sourceHandle = Column(String, nullable=True)
    targetHandle = Column(String, nullable=True)
    source = Column(String, nullable=False)
    target = Column(String, nullable=False)
    type = Column(String, nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="edges")
