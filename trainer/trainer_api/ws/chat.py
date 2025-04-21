import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from trainer_api.scheduler.task import Task
from trainer_api.scheduler.worker import Worker
from trainer_api.utils.constants import BASE_MODELS, TRAINING_METHODS
from trainer_api.utils import logging_utils

chat_logger = logging_utils.get_stream_logger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        chat_logger.info(f"----------NEW CONNECT COMING-----------------------")
        chat_logger.info(f"[SCOPE]: {self.scope}")
        # TODO: not use client_port as group name. Instead, use jobId/taskId
        self.client_port = self.scope["client"][1]
        await self.channel_layer.group_add(str(self.client_port), self.channel_name)

        # Accept the WebSocket connection
        await self.accept()

        chat_logger.info(
            f"Client connected: {self.scope['client']} with channel name {self.channel_name}"
        )

    async def disconnect(self, close_code):
        # Clean up when the WebSocket closes
        chat_logger.info(
            f"Client disaconnected: {self.scope['client']} disconnected with {self.channel_name} | Close Code: {close_code}"
        )
        await self.channel_layer.group_discard(str(self.client_port), self.channel_name)

    async def receive(self, text_data):
        """
        Handle any incoming message from client. Here we define 2 cases
        1. request for starting a job
        2. any other cases
        These cases are differentiated by the text_data_json["type"]

        We respond to client once we get the message, and follow the HTTP format
        """
        text_data_json = json.loads(text_data)

        type = text_data_json.get("type")
        message = text_data_json.get("message")
        data = text_data_json.get("data")

        chat_logger.info(
            f"Received message for {self.client_port}: {type} | {message} | {data}"
        )

        if type == "command":
            if (
                not data
                or data.get("baseModel") not in BASE_MODELS
                or data.get("datasetName") is None
                or data.get("trainingMethod")
                not in map(lambda m: m["name"], TRAINING_METHODS)
            ):
                chat_logger.warning(
                    f"Client requested for {type.upper()}, but did not give valid data"
                )
                await self.send(
                    text_data=json.dumps(
                        {
                            "status": "failed",
                            "code": 400,
                            "message": f"Client requested for {type.upper()}, but did not give valid data",
                        }
                    )
                )
                return

            try:
                # schedule the task and respond immediately
                chat_logger.info("[Worker] Submitting task")
                worker = Worker()

                t = Task(
                    method=data["trainingMethod"],
                    model=data["baseModel"],
                    dataset=data["datasetName"],
                    ws=self,
                )
                worker.submit(t)

                await self.send(
                    text_data=json.dumps(
                        {
                            "status": "success",
                            "code": 200,
                            "message": f"Added task {t.id} to queue",
                        }
                    )
                )
            except Exception as e:
                chat_logger.error(e)
                await self.send(
                    text_data=json.dumps(
                        {
                            "status": "error",
                            "code": 500,
                            "message": f"An error occurred: {e}",
                        }
                    )
                )

    async def send_job_update(self, event):
        message = event["message"]
        assert isinstance(message, str), "jon update must be str"

        await self.send(text_data=message)

    async def send_message_to_client(self, responseJson):
        channel_layer = get_channel_layer()
        chat_logger.info(f"Sending message to {self.client_port}: {responseJson}")
        await channel_layer.group_send(
            str(self.client_port),
            {"type": "send_job_update", "message": responseJson},
        )

    def send_message_to_client_sync(self, message: str) -> None:
        assert isinstance(message, str), "message must be str"
        channel_layer = get_channel_layer()
        chat_logger.info(f"Sending message to group {self.client_port}: {message}")
        async_to_sync(channel_layer.group_send)(
            str(self.client_port),
            {"type": "send_job_update", "message": message},
        )
