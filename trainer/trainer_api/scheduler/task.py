import sys
import uuid

from trainer_api.reporter.factory import TrainerReporterFactory
from trainer_api.utils.errors import InvalidArgumentError
from trainer_api.utils.constants import (
    BASE_MODELS,
    TRAINING_METHODS,
)
from trainer_api.utils import logging_utils
from trainer_api.finetune.sft import SFTRunner

logger = logging_utils.get_stream_logger("TrainerTask")


class Task:
    def __init__(self, **kwargs):
        self.id = uuid.uuid4()
        self.retried = 0
        self.max_retry = (
            kwargs["max_retry"] if "max_retry" in kwargs else 1
        )  # default retry once
        self.output = (
            kwargs["output"] if "output" in kwargs else sys.stdout
        )  # default retry once

        self.method = kwargs.get("method")
        if self.method is None:
            raise InvalidArgumentError(source=None, message="Missing method")
        self.model = kwargs.get("model")
        if self.model is None:
            raise InvalidArgumentError(source=None, message="Missing model")
        self.dataset = kwargs.get("dataset")
        if self.dataset is None:
            raise InvalidArgumentError(source=None, message="Missing dataset")
        self.hparams = kwargs.get("training_args")
        self.ws = kwargs.get("ws")

    def run(self):
        if self.method == "SFT":
            reporter_factory = TrainerReporterFactory()
            reporter = reporter_factory.create_reporter(
                channel_name=None, channel_group_id=self.ws.client_port
            )
            r = SFTRunner(self.id, reporter)
            r.run(self.model, self.method, self.dataset, self.hparams)

    def __str__(self):
        return f"[Task] method: {self.method if hasattr(self, 'method') else 'None'} | model: {self.model if hasattr(self, 'model') else 'None'}"
