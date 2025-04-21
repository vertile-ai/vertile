import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time communication.

    Args:
        websocket (WebSocket): WebSocket connection object
    """
    await connection_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Message received: {data}")

            # Echo back to the sender
            await connection_manager.send_personal_message(
                f"You sent: {data}", websocket
            )

            # Example of broadcast - commented out by default
            # await connection_manager.broadcast(f"Client sent: {data}")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
