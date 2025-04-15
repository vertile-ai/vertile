from ninja import Schema
from typing import Optional, List, Union
from datetime import datetime


class ModelBase(Schema):
    name: str
    description: Optional[str] = None


class ModelIn(ModelBase):
    pass


class ModelOut(ModelBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: str


class ErrorResponse(Schema):
    message: str
