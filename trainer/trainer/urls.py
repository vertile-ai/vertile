from django.urls import path
from trainer_api.rest.api import api

urlpatterns = [
    path("api/", api.urls),  # Django Ninja API
]
