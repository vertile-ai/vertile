from fastapi import APIRouter
from app.api.v1.endpoints import health, tasks, items

api_router = APIRouter()

# Include routers from endpoints
api_router.include_router(health.router)
api_router.include_router(tasks.router)
api_router.include_router(items.router)

# Add more endpoint routers here as they are created
# api_router.include_router(some_feature.router)
