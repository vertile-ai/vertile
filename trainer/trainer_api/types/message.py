from typing import Literal, TypedDict


class TrainerMessageData(TypedDict):
    task_id: str


class TrainerMessage(TypedDict):
    type: Literal["title", "info", "warning"]
    message: str
    data: TrainerMessageData
    code: int
