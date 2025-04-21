from collections import defaultdict
from datetime import datetime
import os
import sys
import threading
import subprocess
import time
from typing import Dict, List
import uuid

from trainer.settings import BASE_DIR
from trainer_api.utils.logging_utils import get_stream_logger, log_and_print
from trainer_api.utils.constants import (
    LOG_DIR,
    MAX_IDLE_TIME,
    WorkerStates,
)
from trainer_api.scheduler.task import Task
from .queue import MQueue
from queue import Queue
from multiprocessing import Manager


def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


worker_manager_logger = get_stream_logger("WorkerManager")
worker_thread_logger = get_stream_logger("WorkerThread")


@singleton
class Worker:
    """
    Worker - Singleton Class of the Worker Manager
    A little bit thread pool implementation for our needs
    More refers to ./README.md
    """

    def __init__(self, **kwargs):
        # TODO: USE PriorityQueue
        self.task_queue = MQueue[Task]()
        self.task_queue_lock = threading.Lock()

        # start a scheduler that check idle time of all threads and shutdown any that exceeds
        self.max_idle_time = (
            kwargs["max_idle_time"] if "max_idle_time" in kwargs else MAX_IDLE_TIME
        )
        self.max_thread = kwargs["max_thread"] if "max_thread" in kwargs else 1

        self.thread_map: Dict[int, WorkerThread] = {}

        # a representation of idle thread queue, a flag ttaso tell if we should spawn new thread
        self._idle_semaphore = threading.Semaphore(0)

    def job_finished(self, worker_id: int):
        t = self.thread_map.pop(worker_id)
        self._idle_semaphore.release()
        self.urge_worker()

    def submit(self, task_instance):
        """
        Add a task to the queue anyway
        Then check if there are worker threads number exceeding max number
        if not, spawn a thread to take the task
        if yes, just return, as the worker has restarted working
        """
        self.task_queue.add(task_instance)
        self.urge_worker()
        return 1

    def urge_worker(self):
        """
        Urge a worker to do the job and make sure starting doing the job
        if there are existing idle worker, just reuse
        if there is no idle worker, spawn a new one
        if total number of workers have exceeded max number, return None
        """
        if self._idle_semaphore.acquire(timeout=0):
            worker_manager_logger.info(
                f"the worker is already working on a task, no spawning"
            )
            return

        if len(self.thread_map) < self.max_thread:
            worker_manager_logger.info(f"spawning a new worker, as no one is available")
            t = WorkerThread(self)
            t.daemon = True
            t.start()
            self.thread_map[t.id] = t

    def pop_task(self) -> Task | None:
        return self.task_queue.pop()


class WorkerThread(threading.Thread):
    """
    A worker thread that does the job
    It has states for itself, but they should be handled by Worker, the manager
    """

    # TODO: add a flag that can control the shutdown of a thread from external
    # TODO: weak ref the instance
    def __init__(self, worker_instance: Worker):
        super().__init__()
        self.worker_instance = worker_instance
        self.state = WorkerStates.IDLE
        self.id = uuid.uuid4()

    def notify_job_finished(self):
        self.worker_instance.job_finished(self.id)

    def run(self):
        # prepare the log file
        log_filename = datetime.now().strftime("%Y%m%d_%H%M%S_worker")
        log_filename += f"_{self.id}.txt"

        log_path = os.path.join(LOG_DIR, log_filename)
        os.makedirs(LOG_DIR, exist_ok=True)

        with open(log_path, "w+") as log:
            log_and_print(
                worker_thread_logger, log, f"|{self.id}| A worker thread started"
            )

            if self.worker_instance.task_queue.length == 0:
                log_and_print(
                    worker_thread_logger, log, "[Worker] Nothing in queue, finished"
                )
                return

            try:
                while True:
                    task = self.worker_instance.pop_task()
                    worker_thread_logger.info(f"popped a task {task}")
                    if task is None:
                        log_and_print(
                            worker_thread_logger,
                            log,
                            f"[Worker_{self.id}] Nothing to pick | state: {self.state}",
                        )
                        time.sleep(1)

                    elif self.state == WorkerStates.BUSY:
                        log_and_print(
                            worker_thread_logger,
                            log,
                            f"[Worker_{self.id}] Worker cannot pick up job atm. {self.state}.",
                        )
                        time.sleep(1)

                    else:
                        self.task_id = task.id
                        log_and_print(
                            worker_thread_logger,
                            log,
                            f"[Worker_{self.id}] Picked a task: {task}",
                        )
                        # process task
                        self.state = WorkerStates.BUSY
                        task.run()

                        # task is done
                        log_and_print(
                            worker_thread_logger,
                            log,
                            f"[Worker_{self.id}] Task completed: {task}",
                        )
                        self.state = WorkerStates.IDLE

            except subprocess.CalledProcessError as e:
                log_and_print(worker_thread_logger, log, f"{str(e)}", "error")

                self.state = WorkerStates.ERROR

                if task.retried < task.max_retry:
                    task.retried += 1
                    # put back to the queue
                    log_and_print(
                        worker_thread_logger,
                        log,
                        f"[Worker] put a task back to the queue for retry: {task}",
                    )

            self.notify_job_finished()

        return
