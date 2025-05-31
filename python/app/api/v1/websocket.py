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

        # Execute the workflow
        result = await workflow_execution_service.execute_workflow(
            workflow_id, nodes, edges
        )

        # Send initial response to the client
        await websocket.send_text(
            json.dumps(
                {
                    "event": "workflow-execution-started",
                    "data": {"workflow_id": workflow_id, "status": "started"},
                }
            )
        )

        # Set up the execution status reporter
        reporter = create_execution_status_reporter(workflow_id)

        # Store the original method reference
        original_report_method = workflow_execution_service._report_execution_status

        # Replace with a new method that calls our custom reporter
        async def wrapped_report_execution_status(
            self, workflow_id: str, event_type: str, data: Dict[str, Any]
        ) -> None:
            # Call the reporter function
            await reporter(workflow_id, event_type, data)

        # Store original method in the reporter function for cleanup later
        setattr(reporter, "original_method", original_report_method)

        # Assign the method to the instance
        workflow_execution_service._report_execution_status = (
            wrapped_report_execution_status.__get__(
                workflow_execution_service, type(workflow_execution_service)
            )
        )

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


def create_execution_status_reporter(workflow_id: str):
    """
    Create a function to report execution status updates via WebSocket.

    Args:
        workflow_id: ID of the workflow being executed

    Returns:
        A function that can be used to report execution status
    """

    async def report_execution_status(
        workflow_id: str, event_type: str, data: Dict[str, Any]
    ) -> None:
        """
        Report execution status to all clients subscribed to this workflow.

        Args:
            workflow_id: ID of the workflow
            event_type: Type of event to report (e.g., "node-status-update")
            data: Event data
        """
        await websocket_manager.send_message_to_workflow(
            workflow_id, {"event": event_type, "data": data}
        )

        # If this is a completion or error event, restore the original method
        if event_type in ["workflow-execution-completed", "workflow-execution-error"]:
            # Get the original method from the module scope (defined when handling execute workflow)
            if hasattr(report_execution_status, "original_method"):
                original = getattr(report_execution_status, "original_method")
                workflow_execution_service._report_execution_status = original
                logger.debug(
                    f"Restored original _report_execution_status method after {event_type}"
                )

    return report_execution_status
