import asyncio
import logging
from typing import Dict, List, Any, Callable

from app.services.websocket_manager import websocket_manager
from app.executors.llm_executor import LLMExecutor
from app.executors.base_executor import BaseExecutor

logger = logging.getLogger(__name__)


# Node status constants matching the frontend NodeRunningStatus enum
class NodeStatus:
    NOT_START = "not-start"
    WAITING = "waiting"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


# Global registry for node executors
NODE_EXECUTORS: Dict[str, BaseExecutor] = {
    "llm": LLMExecutor,
}


# Example node executor functions
async def execute_data_processor(
    node: Dict, previous_results: Dict, workflow_id: str
) -> Dict:
    """Execute data processor node"""
    node_id = node["id"]
    logger.info(f"Processing data for node {node_id}")

    # Simulate data processing
    await asyncio.sleep(1.5)

    return {
        "node_id": node_id,
        "type": "data_processor",
        "status": "success",
        "execution_time": 1.5,
        "result": f"Data processed successfully for node {node_id}",
        "output": {"processed_records": 100, "data_size": "5MB"},
    }


async def execute_api_call(
    node: Dict, previous_results: Dict, workflow_id: str
) -> Dict:
    """Execute API call node"""
    node_id = node["id"]
    api_config = node.get("data", {}).get("config", {})
    logger.info(f"Making API call for node {node_id}")

    # Simulate API call
    await asyncio.sleep(2.5)

    return {
        "node_id": node_id,
        "type": "api_call",
        "status": "success",
        "execution_time": 2.5,
        "result": f"API call completed for node {node_id}",
        "output": {"response_code": 200, "data": "API response data"},
    }


async def execute_email_sender(
    node: Dict, previous_results: Dict, workflow_id: str
) -> Dict:
    """Execute email sender node"""
    node_id = node["id"]
    email_config = node.get("data", {}).get("config", {})
    logger.info(f"Sending email for node {node_id}")

    # Simulate email sending
    await asyncio.sleep(1.0)

    return {
        "node_id": node_id,
        "type": "email_sender",
        "status": "success",
        "execution_time": 1.0,
        "result": f"Email sent successfully for node {node_id}",
        "output": {
            "recipients": ["user@example.com"],
            "subject": "Workflow Notification",
        },
    }


async def execute_file_processor(node: Dict) -> Dict:
    """Execute file processor node"""
    node_id = node["id"]
    file_config = node.get("data", {}).get("config", {})
    logger.info(f"Processing file for node {node_id}")

    # Simulate file processing
    await asyncio.sleep(3.0)

    return {
        "node_id": node_id,
        "type": "file_processor",
        "status": "success",
        "execution_time": 3.0,
        "result": f"File processed successfully for node {node_id}",
        "output": {"files_processed": 5, "total_size": "15MB"},
    }


async def execute_conditional(
    node: Dict, previous_results: Dict, workflow_id: str
) -> Dict:
    """Execute conditional node"""
    node_id = node["id"]
    condition_config = node.get("data", {}).get("config", {})
    logger.info(f"Evaluating condition for node {node_id}")

    # Simulate condition evaluation
    await asyncio.sleep(0.5)

    # Simple condition evaluation (can be made more complex)
    condition_result = True  # This would be actual condition logic

    return {
        "node_id": node_id,
        "type": "conditional",
        "status": "success",
        "execution_time": 0.5,
        "result": f"Condition evaluated for node {node_id}",
        "output": {"condition_met": condition_result},
    }


# Register node executors in the global dictionary
NODE_EXECUTORS.update(
    {
        "data_processor": execute_data_processor,
        "api_call": execute_api_call,
        "email_sender": execute_email_sender,
        "file_processor": execute_file_processor,
        "conditional": execute_conditional,
    }
)


def register_node_executor(node_type: str, executor_func: Callable) -> None:
    """Register a new node executor function"""
    NODE_EXECUTORS[node_type] = executor_func
    logger.info(f"Registered executor for node type: {node_type}")


def get_registered_node_types() -> List[str]:
    """Get list of all registered node types"""
    return list(NODE_EXECUTORS.keys())


class WorkflowExecutionService:
    def __init__(self):
        # Store active workflow executions by workflow ID
        self.active_executions: Dict[str, asyncio.Task] = {}

    async def execute_workflow(
        self,
        workflow_id: str,
        nodes: List[Dict],
        edges: List[Dict],
    ):
        """
        Execute a workflow by its ID using the provided nodes and edges.

        Args:
            workflow_id: The unique identifier of the workflow
            nodes: List of node objects from the frontend
            edges: List of edge objects from the frontend
            reporter: Optional function to report execution status updates

        Returns:
            A dictionary containing execution results
        """
        # Cancel any existing execution for this workflow
        if workflow_id in self.active_executions:
            self.active_executions[workflow_id].cancel()
            try:
                await self.active_executions[workflow_id]
            except asyncio.CancelledError:
                logger.info(f"Cancelled previous execution of workflow {workflow_id}")

        # Create a new execution task
        execution_task = asyncio.create_task(
            self._execute_workflow_process(workflow_id, nodes, edges)
        )
        self.active_executions[workflow_id] = execution_task

        return {"status": "started", "workflow_id": workflow_id}

    async def _execute_workflow_process(
        self,
        workflow_id: str,
        nodes: List[Dict],
        edges: List[Dict],
    ) -> Dict:
        """
        Internal method to run the workflow execution process.

        Performs topological sort and executes the workflow DAG layer by layer.
        """
        try:
            # Convert nodes and edges to a format suitable for processing
            node_map = {node["id"]: node for node in nodes}

            # Build adjacency list for DAG
            graph: Dict[str, List[str]] = {node["id"]: [] for node in nodes}
            in_degree: Dict[str, int] = {node["id"]: 0 for node in nodes}

            for edge in edges:
                source = edge["source"]
                target = edge["target"]
                graph[source].append(target)
                in_degree[target] += 1

            # Initialize all nodes as NOT_START
            node_statuses = {node["id"]: NodeStatus.NOT_START for node in nodes}

            # Report initial node statuses
            await self._report_execution_status(
                workflow_id,
                "node-status-update",
                {"node_statuses": node_statuses},
            )

            # Perform topological sort to find execution layers
            execution_layers = self._topological_sort(graph, in_degree)

            # Execute each layer
            execution_results = {}
            for layer_idx, layer in enumerate(execution_layers):
                layer_results = {}
                logger.info(f"Executing layer {layer_idx + 1} with nodes: {layer}")

                # Mark nodes in this layer as WAITING
                for node_id in layer:
                    node_statuses[node_id] = NodeStatus.WAITING

                # Report node status updates
                await self._report_execution_status(
                    workflow_id,
                    "node-status-update",
                    {"node_statuses": node_statuses},
                )

                # Simulate execution of each node in the layer
                execution_tasks = []

                # Mark nodes as RUNNING
                for node_id in layer:
                    node_statuses[node_id] = NodeStatus.RUNNING
                    node = node_map[node_id]
                    task = asyncio.create_task(
                        self._execute_node(
                            workflow_id, node, execution_results, node_statuses
                        )
                    )
                    execution_tasks.append((node_id, task))

                # Report node status updates
                await self._report_execution_status(
                    workflow_id,
                    "node-status-update",
                    {"node_statuses": node_statuses},
                )

                # Wait for all tasks in the layer to complete
                for node_id, task in execution_tasks:
                    try:
                        result = await task
                        layer_results[node_id] = result
                        execution_results[node_id] = result
                        node_statuses[node_id] = NodeStatus.SUCCEEDED
                    except Exception as e:
                        logger.error(f"Error executing node {node_id}: {str(e)}")
                        node_statuses[node_id] = NodeStatus.FAILED
                        execution_results[node_id] = {
                            "status": "error",
                            "error": str(e),
                        }

                # Report node status updates
                await self._report_execution_status(
                    workflow_id,
                    "node-status-update",
                    {"node_statuses": node_statuses},
                )

                # Report layer completion
                await self._report_execution_status(
                    workflow_id,
                    "workflow-execution-progress",
                    {
                        "current_layer": layer_idx,
                        "nodes_completed": list(layer_results.keys()),
                        "results": layer_results,
                    },
                )

            logger.info(f"Workflow {workflow_id} execution completed")

            # Final report of workflow completion
            await self._report_execution_status(
                workflow_id,
                "workflow-execution-completed",
                {
                    "status": "completed",
                    "results": execution_results,
                    "node_statuses": node_statuses,
                },
            )

            return {"status": "completed", "results": execution_results}

        except Exception as e:
            logger.error(f"Error executing workflow {workflow_id}: {str(e)}")
            await self._report_execution_status(
                workflow_id,
                "workflow-execution-error",
                {"status": "error", "error": str(e)},
            )
            return {"status": "error", "error": str(e)}

    def _topological_sort(
        self, graph: Dict[str, List[str]], in_degree: Dict[str, int]
    ) -> List[List[str]]:
        """
        Perform topological sort on the workflow graph to determine execution layers.

        Returns:
            A list of layers, where each layer is a list of node IDs that can be executed in parallel
        """
        layers = []
        queue = [node for node, degree in in_degree.items() if degree == 0]

        while queue:
            current_layer = queue.copy()
            queue = []
            layers.append(current_layer)

            for node in current_layer:
                for neighbor in graph[node]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        queue.append(neighbor)

        # Check if there's a cycle in the graph
        if sum(len(layer) for layer in layers) != len(graph):
            raise ValueError("Workflow contains a cycle and cannot be executed")

        return layers

    async def _execute_node(
        self,
        workflow_id: str,
        node: Dict,
        previous_results: Dict,
        node_statuses: Dict[str, str],
    ) -> Dict:
        """
        Execute a single node in the workflow using the global executor registry.
        """
        node_id = node["id"]
        node_type = node["data"]["type"]

        logger.info(f"Executing node {node_id} of type {node_type}")

        # Get the executor function from the global registry
        executor_class = NODE_EXECUTORS.get(node_type)
        if not executor_class:
            raise ValueError(
                f"Unknown node type: {node_type}. Available types: {list(NODE_EXECUTORS.keys())}"
            )

        # Execute the node using the appropriate executor
        executor = executor_class()
        logger.info(f"Executor: {executor}")
        try:
            result = await executor.execute(node)
            return result
        except Exception as e:
            logger.error(f"Error in executor for node type {node_type}: {str(e)}")
            # Return error result
            return {
                "node_id": node_id,
                "type": node_type,
                "status": "error",
                "execution_time": 0.0,
                "result": f"Error executing {node_type} node: {str(e)}",
                "error": str(e),
            }

    async def _report_execution_status(
        self,
        workflow_id: str,
        event_type: str,
        data: Dict[str, Any],
    ) -> None:
        """
        Report execution status using the injected reporter function.

        Args:
            workflow_id: ID of the workflow
            event_type: Type of event to report (e.g., "node-status-update")
            data: Event data to send to the client
            reporter: The injected reporter function
        """
        await websocket_manager.send_message_to_workflow(
            workflow_id, {"event": event_type, "data": data}
        )


# Create a singleton instance
workflow_execution_service = WorkflowExecutionService()
