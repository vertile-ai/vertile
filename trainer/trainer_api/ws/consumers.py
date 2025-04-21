import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from trainer_api.scheduler.task import Task
from trainer_api.scheduler.worker import Worker
from trainer_api.utils.constants import BASE_MODELS, TRAINING_METHODS
from trainer_api.utils import logging_utils

training_consumer_logger = logging_utils.get_stream_logger(__name__)


class TrainingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        training_consumer_logger.info(
            f"----------NEW CONNECT COMING-----------------------"
        )
        training_consumer_logger.info(f"[SCOPE]: {self.scope}")
        self.client_port = str(self.scope["client"][1])
        await self.channel_layer.group_add(self.client_port, self.channel_name)

        # Accept the WebSocket connection
        await self.accept()

        training_consumer_logger.info(
            f"Client connected: {self.scope['client']} with channel name {self.channel_name}"
        )

    async def disconnect(self, close_code):
        # Clean up when the WebSocket closes
        training_consumer_logger.info(
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

        training_consumer_logger.info(
            f"Received message for {self.client_port}: {type} | {message} | {data}"
        )

        if type == "command":
            if (
                not data
                or data.get("baseModel") is None
                or data.get("datasetName") is None
                or data.get("trainingMethod") not in TRAINING_METHODS
            ):
                training_consumer_logger.warning(
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
                training_consumer_logger.info("Submitting task")
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
                            "type": "info",
                            "message": f"Added task {t.id} to queue",
                            "data": {
                                "task_id": str(t.id),
                            },
                        }
                    )
                )
            except Exception as e:
                training_consumer_logger.error(e)
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
        training_consumer_logger.info(
            f"Sending message to {self.client_port}: {responseJson}"
        )
        await channel_layer.group_send(
            str(self.client_port),
            {"type": "send_job_update", "message": responseJson},
        )
