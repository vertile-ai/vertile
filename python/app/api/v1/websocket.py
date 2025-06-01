import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import websocket_manager
from app.services.workflow_execution import workflow_execution_service
from typing import Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/workflow/{workflow_id}")
async def workflow_websocket_endpoint(websocket: WebSocket, workflow_id: str):
    """
    WebSocket endpoint for workflow-specific connections.
    Each client connects to a specific workflow by ID.
    """
    logger.info(f"Router: Connecting to workflow {workflow_id}")
    await websocket_manager.connect(websocket, workflow_id)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message for workflow {workflow_id}: {data}")

            try:
                # Parse the message
                message = json.loads(data)
                event_type = message.get("event")

                if event_type == "execute-workflow":
                    await handle_execute_workflow(
                        workflow_id, message.get("data", {}), websocket
                    )
                else:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "event": "error",
                                "data": {
                                    "message": f"Unknown event type: {event_type}"
                                },
                            }
                        )
                    )

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
                await websocket.send_text(
                    json.dumps(
                        {"event": "error", "data": {"message": "Invalid JSON format"}}
                    )
                )

            except Exception as e:
                logger.exception(f"Error processing message: {str(e)}")
                await websocket.send_text(
                    json.dumps(
                        {
                            "event": "error",
                            "data": {"message": f"Error processing request: {str(e)}"},
                        }
                    )
                )

    except WebSocketDisconnect:
        logger.warning(f"Router: Disconnecting from workflow {workflow_id}")
        websocket_manager.disconnect(websocket, workflow_id)


async def handle_execute_workflow(
    workflow_id: str, data: Dict[str, Any], websocket: WebSocket
):
    """
    Handle a request to execute a workflow.

    Args:
        workflow_id: ID of the workflow to execute
        data: Workflow data including nodes and edges
        websocket: The client WebSocket connection
    """
    try:
        # Validate the request
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])

        if not nodes:
            raise ValueError("No nodes provided")

        # Send initial response to the client
        await websocket.send_text(
            json.dumps(
                {
                    "event": "workflow-execution-started",
                    "data": {"workflow_id": workflow_id, "status": "started"},
                }
            )
        )

        # Execute the workflow with the injected reporter
        result = await workflow_execution_service.execute_workflow(
            workflow_id, nodes, edges
        )

        logger.info(f"Workflow execution initiated for {workflow_id}: {result}")

    except Exception as e:
        logger.exception(f"Error executing workflow {workflow_id}: {str(e)}")
        await websocket.send_text(
            json.dumps(
                {
                    "event": "workflow-execution-error",
                    "data": {"workflow_id": workflow_id, "error": str(e)},
                }
            )
        )
