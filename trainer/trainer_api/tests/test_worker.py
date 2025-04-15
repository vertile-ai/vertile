import time
from django.test import TestCase

from trainer_api.scheduler.worker import Worker
from trainer_api.scheduler.task import Task

# Create your tests here.


class MockTask(Task):
    def run(self):
        print("task being run")
        time.sleep(2)
        print("task is done")


class WorkerTestCase(TestCase):
    def setUp(self):
        # Create test data
        self.worker = Worker()

    def test_worker_submit(self):
        """
        Must spawn a worker and pick up the job
        """
        for _ in range(10):
            self.worker.submit(MockTask(method="fake", model="fake", dataset="fake"))
            time.sleep(1)
        # by default, there should be only one worker maximum
        self.assertEqual(len(self.worker.thread_map), 1)
