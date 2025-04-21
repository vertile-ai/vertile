from typing import TypeVar, Generic, Optional, List
from .queue import PriorityQueue, PriorityQueueParams

T = TypeVar("T")


class TaskPriority(Generic[T]):
    """
    A container class that pairs a task with its priority.

    This allows explicit priority assignment without modifying the original task.
    """

    def __init__(self, task: T, priority: int):
        self.task = task
        self.priority = priority

    def __eq__(self, other):
        if not isinstance(other, TaskPriority):
            return False
        return self.task == other.task and self.priority == other.priority

    def __repr__(self):
        return f"TaskPriority(task={self.task!r}, priority={self.priority})"


T = TypeVar("T")


class TaskQueue(Generic[T]):
    """
    A priority queue specialized for handling tasks with explicit priorities.

    The queue acts as a minheap, where the task with the lowest priority value
    is the highest priority.

    This queue stores TaskPriority objects but provides an API that works
    directly with tasks and priorities.
    """

    def __init__(self):
        # Create a priority queue that sorts by the priority field
        self._queue = PriorityQueue.with_priority_field("priority")

    def add(self, task: T, priority: int) -> bool:
        """
        Add a task with the specified priority to the queue.

        Args:
            task: The task to add
            priority: The priority value (lower values = higher priority)

        Returns:
            bool: True if the task was added successfully
        """
        task_priority = TaskPriority(task, priority)
        return self._queue.add(task_priority)

    def pop(self) -> Optional[T]:
        """
        Remove and return the highest priority task.

        Returns:
            The task with the highest priority, or None if the queue is empty
        """
        result = self._queue.pop()
        if result is None:
            return None
        return result.task

    def peek(self) -> Optional[T]:
        """
        Return the highest priority task without removing it.

        Returns:
            The task with the highest priority, or None if the queue is empty
        """
        result = self._queue.peek()
        if result is None:
            return None
        return result.task

    def is_empty(self) -> bool:
        """Check if the queue is empty."""
        return self._queue.is_empty()

    def size(self) -> int:
        """Get the number of tasks in the queue."""
        return self._queue.size()

    @property
    def length(self) -> int:
        """Get the number of tasks in the queue."""
        return self._queue.length
