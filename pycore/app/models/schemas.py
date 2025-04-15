from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ItemBase(BaseModel):
    """Base schema for Item without id and timestamps."""

    title: str
    description: Optional[str] = None
    completed: bool = False


class ItemCreate(ItemBase):
    """Schema for creating a new Item."""

    pass


class ItemUpdate(BaseModel):
    """Schema for updating an Item."""

    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class Item(ItemBase):
    """Schema for Item response, including id and timestamps."""

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""

        from_attributes = True  # For SQLAlchemy models
