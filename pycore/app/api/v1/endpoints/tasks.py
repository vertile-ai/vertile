import time
import logging
from fastapi import APIRouter, BackgroundTasks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])


def process_long_running_task(task_id: str):
    """
    Simulates a long-running background process.

    Args:
        task_id: Unique identifier for the task
    """
    logger.info(f"Starting background task {task_id}")
    # Simulate work
    time.sleep(5)
    logger.info(f"Background task {task_id} completed")


@router.post("/")
async def create_task(background_tasks: BackgroundTasks):
    """
    Creates a new background task.

    This endpoint demonstrates how to use FastAPI's background tasks
    to process long-running operations without blocking the response.

    Returns:
        dict: Task information
    """
    task_id = f"task-{time.time()}"
    background_tasks.add_task(process_long_running_task, task_id)
    return {"task_id": task_id, "status": "processing"}
