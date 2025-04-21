from abc import ABC, abstractmethod
import json
from typing import Any, Callable
from .reporter import TrainerReporter


class ReporterFactory(ABC):
    def __init__(self):
        if type(self) is ReporterFactory:
            raise TypeError(
                "ReporterFactory is an abstract base class and cannot be instantiated directly."
            )

    @abstractmethod
    def create_reporter(self, **kwargs):
        pass


class TrainerReporterFactory(ReporterFactory):
    def create_reporter(self, **kwargs) -> TrainerReporter:
        """
        Create a reporter with the media.
        """
        trainer_reporter = TrainerReporter(
            channel_name=kwargs["channel_name"],
            channel_group_id=kwargs["channel_group_id"],
        )
        return trainer_reporter
