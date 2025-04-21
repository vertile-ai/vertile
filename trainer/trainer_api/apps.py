import threading
from django.apps import AppConfig


class TrainerApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "trainer_api"

    _ready_lock = threading.Lock()
    _ready_executed = False

    def ready(self):
        with self._ready_lock:
            if not self._ready_executed:
                self._ready_executed = True
