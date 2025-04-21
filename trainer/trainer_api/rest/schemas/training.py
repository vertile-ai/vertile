# trainer_api/rest/schemas/training.py
from ninja import Schema
from typing import Optional


class TrainingRequest(Schema):
    trainingMethod: str
    baseModel: str
    datasetName: str


class TaskResponse(Schema):
    task_id: str


class SuccessResponse(Schema):
    status: str = "success"
    message: str
    data: Optional[TaskResponse] = None


class ErrorResponse(Schema):
    status: str = "error"
    message: str
    code: int = 400
