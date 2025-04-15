# trainer_api/rest/controllers/training.py
from ninja import Router
from trainer_api.scheduler.task import Task
from trainer_api.scheduler.worker import Worker
from trainer_api.utils.constants import BASE_MODELS, TRAINING_METHODS
from trainer_api.utils import logging_utils
from ..schemas.training import (
    TrainingRequest,
    SuccessResponse,
    ErrorResponse,
    TaskResponse,
)

router = Router(tags=["training"])
api_logger = logging_utils.get_stream_logger("api")


@router.post(
    "/job", response={200: SuccessResponse, 400: ErrorResponse, 500: ErrorResponse}
)
def train(request, data: TrainingRequest):
    api_logger.info(f"Received training request: {data}")

    if (
        data.trainingMethod not in TRAINING_METHODS
        or data.baseModel not in BASE_MODELS
        or not data.datasetName
    ):
        return 400, ErrorResponse(message="Invalid request parameters", code=400)

    try:
        # Schedule task and respond immediately
        worker = Worker()
        t = Task(
            method=data.trainingMethod,
            model=data.baseModel,
            dataset=data.datasetName,
        )
        worker.submit(t)

        return 200, SuccessResponse(
            message=f"Added task {t.id} to queue", data=TaskResponse(task_id=str(t.id))
        )
    except Exception as e:
        api_logger.error(f"Error processing training request: {e}")
        return 500, ErrorResponse(message=f"An error occurred: {str(e)}", code=500)
