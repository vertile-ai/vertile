import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebsocketManager:
    def __init__(self):
        # Dictionary to store active connections by workflow ID
        self.workflow_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (not associated with a specific workflow)
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, workflow_id: Optional[str] = None):
        """
        Connect a client to the WebSocket server

        Args:
            websocket: The WebSocket connection
            workflow_id: Optional workflow ID to associate this connection with
        """
        logger.debug(f"Connecting to workflow {workflow_id}")
        await websocket.accept()
        logger.debug(f"Accepted connection to workflow {workflow_id}")

        if workflow_id:
            if workflow_id not in self.workflow_connections:
                self.workflow_connections[workflow_id] = []
            self.workflow_connections[workflow_id].append(websocket)
            logger.info(
                f"Client connected to workflow {workflow_id}. Total connections: {len(self.workflow_connections[workflow_id])}"
            )
        else:
            self.global_connections.append(websocket)
            logger.info(
                f"Client connected to global channel. Total global connections: {len(self.global_connections)}"
            )

    def disconnect(self, websocket: WebSocket, workflow_id: Optional[str] = None):
        """
        Disconnect a client from the WebSocket server

        Args:
            websocket: The WebSocket connection
            workflow_id: Optional workflow ID this connection was associated with
        """
        if workflow_id and workflow_id in self.workflow_connections:
            if websocket in self.workflow_connections[workflow_id]:
                self.workflow_connections[workflow_id].remove(websocket)
                logger.info(
                    f"Client disconnected from workflow {workflow_id}. Remaining connections: {len(self.workflow_connections[workflow_id])}"
                )

                # Clean up empty workflow connections
                if not self.workflow_connections[workflow_id]:
                    del self.workflow_connections[workflow_id]
        else:
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
                logger.info(
                    f"Client disconnected from global channel. Remaining connections: {len(self.global_connections)}"
                )

    async def send_message_to_workflow(self, workflow_id: str, message: Any):
        """
        Send a message to all clients connected to a specific workflow

        Args:
            workflow_id: The workflow ID
            message: The message to send (will be converted to JSON)
        """
        if workflow_id in self.workflow_connections:
            message_json = json.dumps(message)
            for connection in self.workflow_connections[workflow_id]:
                try:
                    logger.info(
                        f"Reporting execution status for workflow {workflow_id}: {message}"
                    )
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending message to client: {str(e)}")
                    # We'll handle disconnection elsewhere

    async def broadcast_message(self, message: Any):
        """
        Broadcast a message to all connected clients

        Args:
            message: The message to broadcast (will be converted to JSON)
        """
        message_json = json.dumps(message)

        # Send to global connections
        for connection in self.global_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error broadcasting to global client: {str(e)}")

        # Send to all workflow connections
        for workflow_id, connections in self.workflow_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(
                        f"Error broadcasting to workflow {workflow_id} client: {str(e)}"
                    )


# Create a singleton instance
websocket_manager = WebsocketManager()
