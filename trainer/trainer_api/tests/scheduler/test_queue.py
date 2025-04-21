import unittest
from django.test import TestCase
from trainer_api.scheduler.queue import MQueue, PriorityQueue, PriorityQueueParams


class MQueueTestCase(TestCase):
    def setUp(self):
        self.queue = MQueue[int]()

    def test_empty_queue(self):
        self.assertEqual(self.queue.length, 0)
        self.assertIsNone(self.queue.pop())

    def test_add_and_peek(self):
        self.queue.add(1)
        self.assertEqual(self.queue.length, 1)
        self.assertEqual(self.queue.peek(), self.queue.head.next)

    def test_add_and_pop(self):
        self.queue.add(1)
        self.queue.add(2)
        self.queue.add(3)
        self.assertEqual(self.queue.length, 3)

        self.assertEqual(self.queue.pop(), 1)
        self.assertEqual(self.queue.length, 2)
        self.assertEqual(self.queue.pop(), 2)
        self.assertEqual(self.queue.length, 1)
        self.assertEqual(self.queue.pop(), 3)
        self.assertEqual(self.queue.length, 0)

        self.assertIsNone(self.queue.pop())

    def test_add_pop_add(self):
        self.queue.add(1)
        self.queue.add(2)
        self.assertEqual(self.queue.pop(), 1)
        self.queue.add(3)
        self.assertEqual(self.queue.pop(), 2)
        self.assertEqual(self.queue.pop(), 3)
        self.assertIsNone(self.queue.pop())

    def test_string_representation(self):
        self.queue.add(1)
        self.queue.add(2)
        str_repr = str(self.queue)
        self.assertIn("Task: 0", str_repr)
        self.assertIn("->", str_repr)


class PriorityQueueTestCase(TestCase):
    def setUp(self):
        self.queue = PriorityQueue(None)

    def test_empty_queue(self):
        self.assertTrue(self.queue.is_empty())
        self.assertEqual(self.queue.size(), 0)
        self.assertIsNone(self.queue.pop())

    def test_add_and_pop_default_comparator(self):
        self.queue.add(3)
        self.queue.add(1)
        self.queue.add(2)

        self.assertEqual(self.queue.size(), 3)
        self.assertEqual(self.queue.peek(), 1)

        self.assertEqual(self.queue.pop(), 1)
        self.assertEqual(self.queue.pop(), 2)
        self.assertEqual(self.queue.pop(), 3)
        self.assertIsNone(self.queue.pop())

    def test_custom_comparator(self):
        # test max heap behaviour
        max_heap_comparator = lambda a, b: 0 if a == b else -1 if a > b else 1
        params = PriorityQueueParams(comparator=max_heap_comparator)
        max_queue = PriorityQueue(params)

        max_queue.add(3)
        max_queue.add(1)
        max_queue.add(2)

        self.assertEqual(max_queue.peek(), 3)
        self.assertEqual(max_queue.pop(), 3)
        self.assertEqual(max_queue.pop(), 2)
        self.assertEqual(max_queue.pop(), 1)

    def test_initialize_from_list(self):
        init_list = [3, 1, 4, 1, 5, 9]
        params = PriorityQueueParams(from_=init_list)
        queue = PriorityQueue(params)

        self.assertEqual(queue.size(), 6)

        self.assertEqual(queue.pop(), 1)
        self.assertEqual(queue.pop(), 1)
        self.assertEqual(queue.pop(), 3)
        self.assertEqual(queue.pop(), 4)
        self.assertEqual(queue.pop(), 5)
        self.assertEqual(queue.pop(), 9)

    def test_heapify(self):
        queue = PriorityQueue(None)
        queue.q = [5, 3, 1, 4, 2]

        queue.heapify_all()
        self.assertEqual(queue.pop(), 1)
        self.assertEqual(queue.pop(), 2)
        self.assertEqual(queue.pop(), 3)
        self.assertEqual(queue.pop(), 4)
        self.assertEqual(queue.pop(), 5)


class Task:
    """Simple task class for testing"""

    def __init__(self, name, created_at=None):
        self.name = name
        self.created_at = created_at

    def __eq__(self, other):
        if not isinstance(other, Task):
            return False
        return self.name == other.name

    def __hash__(self):
        return hash(self.name)

    def __repr__(self):
        return f"Task(name='{self.name}')"


class PriorityQueueMethodsTestCase(TestCase):
    """Test case for PriorityQueue class methods"""

    def test_with_priority_field(self):
        """Test the with_priority_field class method"""
        # Create a priority queue using the priority field
        queue = PriorityQueue.with_priority_field("priority")

        # Add tasks with different priorities
        task1 = Task("Low Priority Task")
        task1.priority = 3  # not recommended but to illustrate the idea

        task2 = Task("High Priority Task")
        task2.priority = 1

        task3 = Task("Medium Priority Task")
        task3.priority = 2

        queue.add(task1)
        queue.add(task2)
        queue.add(task3)

        # Verify tasks are popped in priority order (lowest first)
        self.assertEqual(queue.pop(), task2)  # Priority 1
        self.assertEqual(queue.pop(), task3)  # Priority 2
        self.assertEqual(queue.pop(), task1)  # Priority 3

    def test_with_priority_key(self):
        """Test the with_priority_key class method"""
        # Create tasks without any priority field
        task1 = Task("Task A")
        task2 = Task("Task B")
        task3 = Task("Task C")

        # Create a separate priority mapping
        priorities = {task1: 3, task2: 1, task3: 2}

        # Create a priority queue using the mapping as priority source
        queue = PriorityQueue.with_priority_key(lambda task: priorities[task])

        # Add tasks
        queue.add(task1)
        queue.add(task2)
        queue.add(task3)

        # Verify items are popped in priority order (lowest first)
        self.assertEqual(queue.pop(), task2)  # Priority 1
        self.assertEqual(queue.pop(), task3)  # Priority 2
        self.assertEqual(queue.pop(), task1)  # Priority 3

    def test_with_external_priority_system(self):
        """Test using an external priority system"""

        # Create a priority queue system for tasks
        class TaskPrioritySystem:
            def __init__(self):
                self.task_priorities = {}
                self.default_priority = 10

            def set_priority(self, task, priority):
                self.task_priorities[task] = priority

            def get_priority(self, task):
                return self.task_priorities.get(task, self.default_priority)

        # Create tasks and priority system
        priority_system = TaskPrioritySystem()

        task1 = Task("Task 1")
        task2 = Task("Task 2")
        task3 = Task("Task 3")

        # Set priorities externally
        priority_system.set_priority(task1, 5)
        priority_system.set_priority(task2, 2)
        priority_system.set_priority(task3, 8)

        # Create queue using the external priority system
        queue = PriorityQueue.with_priority_key(priority_system.get_priority)

        # Add tasks
        queue.add(task1)
        queue.add(task2)
        queue.add(task3)

        # Verify order
        self.assertEqual(queue.pop(), task2)  # Priority 2
        self.assertEqual(queue.pop(), task1)  # Priority 5
        self.assertEqual(queue.pop(), task3)  # Priority 8

        # Change priorities dynamically
        priority_system.set_priority(task3, 1)
        queue.add(task1)  # Priority still 5
        queue.add(task3)  # Now priority 1

        # Verify new order
        self.assertEqual(queue.pop(), task3)  # Now highest priority (1)
        self.assertEqual(queue.pop(), task1)  # Priority 5


if __name__ == "__main__":
    unittest.main()
