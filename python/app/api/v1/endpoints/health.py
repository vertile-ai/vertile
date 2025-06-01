from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: Status of the API
    """
    return {"status": "healthy"}
