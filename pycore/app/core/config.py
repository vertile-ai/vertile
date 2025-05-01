from typing import Optional
from pydantic_settings import BaseSettings


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

    DATABASE_URL: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env.development"


settings = Settings()
