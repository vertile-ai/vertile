import asyncio
import json
import logging
from typing import Dict, List, Any, Set, Tuple
import time

logger = logging.getLogger(__name__)


# Node status constants matching the frontend NodeRunningStatus enum
class NodeStatus:
    NOT_START = "not-start"
    WAITING = "waiting"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class WorkflowExecutionService:
    def __init__(self):
        # Store active workflow executions by workflow ID
        self.active_executions: Dict[str, asyncio.Task] = {}

    async def execute_workflow(
        self, workflow_id: str, nodes: List[Dict], edges: List[Dict]
    ):
        """
        Execute a workflow by its ID using the provided nodes and edges.

        Args:
            workflow_id: The unique identifier of the workflow
            nodes: List of node objects from the frontend
            edges: List of edge objects from the frontend

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
        self, workflow_id: str, nodes: List[Dict], edges: List[Dict]
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
            await self._report_node_statuses(workflow_id, node_statuses)

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
                await self._report_node_statuses(workflow_id, node_statuses)

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
                await self._report_node_statuses(workflow_id, node_statuses)

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
                await self._report_node_statuses(workflow_id, node_statuses)

                # Report layer completion
                await self._report_layer_execution(
                    workflow_id, layer_idx, layer, layer_results
                )

            logger.info(f"Workflow {workflow_id} execution completed")

            # Final report of workflow completion
            await self._report_workflow_completion(
                workflow_id, execution_results, node_statuses
            )

            return {"status": "completed", "results": execution_results}

        except Exception as e:
            logger.error(f"Error executing workflow {workflow_id}: {str(e)}")
            await self._report_workflow_error(workflow_id, str(e))
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
        Execute a single node in the workflow.

        Currently mocks execution by waiting for 2 seconds.
        """
        node_id = node["id"]
        node_type = node["data"]["type"]

        logger.info(f"Executing node {node_id} of type {node_type}")

        # Mock execution time
        await asyncio.sleep(2)

        # Return mock result
        return {
            "node_id": node_id,
            "type": node_type,
            "status": "success",
            "execution_time": 2.0,
            "result": f"Executed {node_type} node with ID {node_id}",
        }

    async def _report_node_statuses(
        self, workflow_id: str, node_statuses: Dict[str, str]
    ) -> None:
        """
        Report the current status of all nodes to subscribers.

        Args:
            workflow_id: ID of the workflow
            node_statuses: Dictionary mapping node IDs to their current status
        """
        await self._report_execution_status(
            workflow_id, "node-status-update", {"node_statuses": node_statuses}
        )

    async def _report_layer_execution(
        self, workflow_id: str, layer_idx: int, layer: List[str], results: Dict
    ) -> None:
        """
        Report the execution status of a layer to any subscribers.
        """
        await self._report_execution_status(
            workflow_id,
            "workflow-execution-progress",
            {
                "current_layer": layer_idx,
                "nodes_completed": list(results.keys()),
                "results": results,
            },
        )

    async def _report_workflow_completion(
        self, workflow_id: str, results: Dict, node_statuses: Dict[str, str]
    ) -> None:
        """
        Report successful workflow completion.
        """
        await self._report_execution_status(
            workflow_id,
            "workflow-execution-completed",
            {"status": "completed", "results": results, "node_statuses": node_statuses},
        )

    async def _report_workflow_error(self, workflow_id: str, error: str) -> None:
        """
        Report workflow execution error.
        """
        await self._report_execution_status(
            workflow_id, "workflow-execution-error", {"status": "error", "error": error}
        )

    async def _report_execution_status(
        self, workflow_id: str, event_type: str, data: Dict
    ) -> None:
        """
        Generic method to report execution status.
        This will be implemented by the websocket handler.

        Args:
            workflow_id: ID of the workflow
            event_type: Type of event to report (e.g., "node-status-update")
            data: Event data to send to the client
        """
        logger.info(
            f"Reporting execution status for workflow {workflow_id}: {event_type}"
        )
        # This is just a placeholder - will be replaced dynamically by the websocket handler
        # with an actual implementation that sends messages to connected clients
        pass


# Create a singleton instance
workflow_execution_service = WorkflowExecutionService()
