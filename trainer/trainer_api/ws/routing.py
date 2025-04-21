from django.urls import path
from . import consumers, chat

websocket_urlpatterns = [
    path("inference/", chat.ChatConsumer.as_asgi()),
    path("training/job/", consumers.TrainingConsumer.as_asgi()),
]
