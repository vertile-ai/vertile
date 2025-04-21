from abc import ABC, abstractmethod
import json
from typing import Any
from trainer_api.utils.logging_utils import get_stream_logger
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from trainer_api.types.message import TrainerMessage

logger = get_stream_logger(__name__)


class Reporter(ABC):
    def __init__(self):
        if type(self) is Reporter:
            raise TypeError(
                "Reporter is an abstract base class and cannot be instantiated directly."
            )

    def __post_init__(self):
        if self.media is None:
            raise ValueError("media must not be none")

    @abstractmethod
    def report(self, message: Any):
        pass


class TrainerReporter(Reporter):
    __slots__ = ("channel_name", "channel_group_id")

    def __init__(self, channel_name, channel_group_id):
        super().__init__()
        self.channel_group_id = channel_group_id
        self.channel_name = channel_name

    def report(self, message: TrainerMessage):
        channel_layer = get_channel_layer(self.channel_name or "default")
        logger.info(
            f"Sending message to group {self.channel_group_id} of layer {self.channel_name or 'default'}: {message}"
        )
        async_to_sync(channel_layer.group_send)(
            str(self.channel_group_id),
            {"type": "send_job_update", "message": json.dumps(message)},
        )
