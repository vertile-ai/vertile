import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    """
    Run the FastAPI application using Uvicorn.

    To start the server:
    python run.py
    """
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info",
    )
