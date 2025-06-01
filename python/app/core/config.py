from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Vertile API"
    CLIENT_URL: str = "http://localhost:3131"
    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]
    OPENAI_API_KEY: str = ""

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8031

    DATABASE_URL: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
