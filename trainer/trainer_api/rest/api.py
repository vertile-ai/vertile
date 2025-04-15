# trainer_api/rest/api.py
from ninja import NinjaAPI
from .controllers import models, training, inference
from .auth import auth_backend

# Create the API with authentication
api = NinjaAPI(
    title="Trainer API",
    version="1.0.0",
    description="API for job scheduling and saving",
    auth=auth_backend,
)

# Add routers from different modules
api.add_router("/models/", models.router)
api.add_router("/training/", training.router)
api.add_router("/inference/", inference.router)
