import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1 import websocket

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.

    This function initializes the FastAPI application with proper configuration,
    registers middleware, and sets up both REST API and WebSocket routes.

    The application structure follows a modular design:
    - API routes are organized by version and resource
    - WebSocket functionality is provided for real-time communication
    - Configuration is loaded from environment variables

    Returns:
        FastAPI: Configured FastAPI application
    """
    application = FastAPI(
        title=settings.PROJECT_NAME,
        description="Backend API supporting both REST and WebSocket connections",
        version="0.1.0",
    )

    # Add CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    application.include_router(api_router, prefix=settings.API_V1_STR)
    application.include_router(websocket.router)

    @application.get("/")
    async def root():
        """Root endpoint."""
        return {"message": f"Welcome to {settings.PROJECT_NAME}"}

    return application


app = create_application()
