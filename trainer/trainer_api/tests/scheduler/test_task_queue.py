import unittest
from django.test import TestCase
from trainer_api.scheduler.task_queue import TaskQueue, TaskPriority


class TaskPriorityQueueTestCase(TestCase):
    """Test case for using TaskPriority with PriorityQueue"""

    def test_direct_task_priority_usage(self):
        """Test using TaskPriority objects directly with the underlying queue"""
        # Create a TaskQueue
        task_queue = TaskQueue()

        # Access the underlying PriorityQueue
        priority_queue = task_queue._queue

        # Create TaskPriority objects
        tp1 = TaskPriority("Task 1", 3)
        tp2 = TaskPriority("Task 2", 1)
        tp3 = TaskPriority("Task 3", 2)

        # Add TaskPriority objects directly to the priority queue
        priority_queue.add(tp1)
        priority_queue.add(tp2)
        priority_queue.add(tp3)

        # Verify size
        self.assertEqual(priority_queue.size(), 3)

        # Verify objects are popped in priority order
        self.assertEqual(priority_queue.pop(), tp2)  # Priority 1
        self.assertEqual(priority_queue.pop(), tp3)  # Priority 2
        self.assertEqual(priority_queue.pop(), tp1)  # Priority 3

    def test_task_priority_comparison(self):
        """Test that TaskPriority objects are compared correctly by priority"""
        # Create TaskPriority objects with the same task but different priorities
        task = "Same Task"
        tp1 = TaskPriority(task, 5)
        tp2 = TaskPriority(task, 3)
        tp3 = TaskPriority(task, 7)

        # Create a priority queue that uses the priority field
        task_queue = TaskQueue()
        priority_queue = task_queue._queue

        # Add the TaskPriority objects
        priority_queue.add(tp1)
        priority_queue.add(tp2)
        priority_queue.add(tp3)

        # They should come out in priority order
        self.assertEqual(priority_queue.pop().priority, 3)
        self.assertEqual(priority_queue.pop().priority, 5)
        self.assertEqual(priority_queue.pop().priority, 7)

    def test_task_queue_vs_direct_usage(self):
        """Compare TaskQueue API with direct TaskPriority usage"""
        # Create tasks
        task1 = "Task A"
        task2 = "Task B"
        task3 = "Task C"

        # Approach 1: Using TaskQueue API
        task_queue = TaskQueue()
        task_queue.add(task1, 3)
        task_queue.add(task2, 1)
        task_queue.add(task3, 2)

        # Approach 2: Using TaskPriority directly
        priority_queue = TaskQueue()._queue  # Get a fresh underlying queue
        priority_queue.add(TaskPriority(task1, 3))
        priority_queue.add(TaskPriority(task2, 1))
        priority_queue.add(TaskPriority(task3, 2))

        # Both approaches should yield the same results
        for _ in range(3):
            # Get from TaskQueue
            task_from_api = task_queue.pop()

            # Get from direct usage and extract task
            task_priority = priority_queue.pop()
            task_from_direct = task_priority.task

            # They should be the same
            self.assertEqual(task_from_api, task_from_direct)

    def test_task_priority_equality(self):
        """Test TaskPriority equality behavior"""
        # Same task, same priority
        tp1 = TaskPriority("Task", 5)
        tp2 = TaskPriority("Task", 5)
        self.assertEqual(tp1, tp2)

        # Same task, different priority
        tp3 = TaskPriority("Task", 10)
        self.assertNotEqual(tp1, tp3)

        # Different task, same priority
        tp4 = TaskPriority("Different", 5)
        self.assertNotEqual(tp1, tp4)

        # Test with complex objects
        class ComplexTask:
            def __init__(self, id):
                self.id = id

            def __eq__(self, other):
                return isinstance(other, ComplexTask) and self.id == other.id

        ct1 = ComplexTask(1)
        ct2 = ComplexTask(1)

        tp5 = TaskPriority(ct1, 5)
        tp6 = TaskPriority(ct2, 5)
        self.assertEqual(tp5, tp6)

    def test_task_priority_with_complex_tasks(self):
        """Test TaskPriority with complex task objects"""

        class Job:
            def __init__(self, id, name):
                self.id = id
                self.name = name

            def __eq__(self, other):
                return isinstance(other, Job) and self.id == other.id

            def __repr__(self):
                return f"Job({self.id}, '{self.name}')"

        # Create jobs
        job1 = Job(1, "Process data")
        job2 = Job(2, "Generate report")
        job3 = Job(3, "Send email")

        # Create TaskPriority objects
        tp1 = TaskPriority(job1, 3)
        tp2 = TaskPriority(job2, 1)
        tp3 = TaskPriority(job3, 2)

        # Use with priority queue
        queue = TaskQueue()._queue
        queue.add(tp1)
        queue.add(tp2)
        queue.add(tp3)

        # Verify order
        self.assertEqual(queue.pop().task, job2)
        self.assertEqual(queue.pop().task, job3)
        self.assertEqual(queue.pop().task, job1)

    def test_task_priority_representation(self):
        """Test the string representation of TaskPriority"""
        tp = TaskPriority("Test Task", 5)
        repr_str = repr(tp)

        # Representation should include both task and priority
        self.assertIn("Test Task", repr_str)
        self.assertIn("5", repr_str)
        self.assertIn("TaskPriority", repr_str)


if __name__ == "__main__":
    unittest.main()
