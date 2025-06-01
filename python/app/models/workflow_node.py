from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid

from app.core.db import Base


class WorkflowNode(Base):
    """SQLAlchemy model for workflow nodes."""

    __tablename__ = "workflow_nodes"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflowId = Column(
        String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    positionX = Column(Integer, nullable=False)
    positionY = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    rawData = Column(JSON, nullable=False)
    data = Column(JSON, nullable=False)

    # Relationships
    workflow = relationship("Workflow", back_populates="nodes")
