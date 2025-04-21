import os
from pydantic import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()


class Settings(BaseSettings):
    """Application settings."""

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Vertile API"

    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
