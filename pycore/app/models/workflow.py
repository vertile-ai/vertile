from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Literal


class NodeData(BaseModel):
    """Data for a workflow node"""
    type: str
    title: Optional[str] = None
    # Add any other fields specific to node data


class Node(BaseModel):
    """A node in the workflow graph"""
    id: str
    data: Dict[str, Any]
    position: Optional[Dict[str, float]] = None


class Edge(BaseModel):
    """An edge in the workflow graph"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow"""
    workflow_id: str = Field(..., description="Unique identifier for the workflow")
    nodes: List[Dict[str, Any]] = Field(..., description="Nodes in the workflow")
    edges: List[Dict[str, Any]] = Field(..., description="Edges connecting the nodes")


class ExecutionStatus(BaseModel):
    """Status of a workflow execution"""
    workflow_id: str
    status: Literal["started", "running", "completed", "error"] 
    current_layer: Optional[int] = None
    nodes_executing: Optional[List[str]] = None
    nodes_completed: Optional[List[str]] = None
    message: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None 