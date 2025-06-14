import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { WorkflowWebSocket } from '@/app/lib/api/websocket';
import { EXECUTIONS_MODE } from '../const';

// Types matching the backend NodeStatus constants
export type NodeRunningStatus =
  | 'not-start'
  | 'waiting'
  | 'running'
  | 'succeeded'
  | 'failed';

// Node execution result structure from backend
export interface NodeExecutionResult {
  node_id: string;
  type: string;
  status: 'succeeded' | 'error' | 'failed';
  execution_time: number;
  result: string;
  error?: string;
  output?: Record<string, any>;
}

// WebSocket event data types
export interface WorkflowExecutionStartedData {
  status: 'executing';
  workflow_id: string;
}

export interface WorkflowExecutionCompletedData {
  status: 'completed';
  results: Record<string, NodeExecutionResult>;
  node_statuses: Record<string, NodeRunningStatus>;
}

export interface WorkflowExecutionErrorData {
  status: 'error' | 'cancelled';
  error: string;
  failed_layer?: number;
  results?: Record<string, NodeExecutionResult>;
  node_statuses?: Record<string, NodeRunningStatus>;
}

export interface WorkflowExecutionProgressData {
  current_layer: number;
  nodes_completed: string[];
  results: Record<string, NodeExecutionResult>;
}

export interface NodeStatusUpdateData {
  node_statuses: Record<string, NodeRunningStatus>;
}

// WebSocket message wrapper
export interface WorkflowWebSocketMessage {
  event: string;
  data:
    | WorkflowExecutionStartedData
    | WorkflowExecutionCompletedData
    | WorkflowExecutionErrorData
    | WorkflowExecutionProgressData
    | NodeStatusUpdateData;
}

export function useWorkflowExecution(workflowId: string) {
  const executionStatus = useStore((s) => s.workflowExecutionStatus);
  const setExecutionStatus = useStore((s) => s.setWorkflowExecutionStatus);

  const [currentLayer, setCurrentLayer] = useState<number>(-1);
  const [layerResults, setLayerResults] = useState<
    Record<number, Record<string, NodeExecutionResult>>
  >({});

  // Workflow store state
  const updateNodeExecutionStatus = useStore(
    (s) => s.updateNodeExecutionStatus
  );
  const clearNodeExecutionStatuses = useStore(
    (s) => s.clearNodeExecutionStatuses
  );
  const setWorkflowMode = useStore((s) => s.setWorkflowMode);

  // Reference to WebSocket connection
  const socketRef = useRef<WorkflowWebSocket | null>(null);
  // Reference to cleanup handlers function
  const cleanupHandlersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Switch to pipeline mode when executing
    if (executionStatus === 'executing') {
      setWorkflowMode(EXECUTIONS_MODE);
    }
  }, [executionStatus, setWorkflowMode]);

  // Connect to WebSocket for this workflow only when workflow is running
  useEffect(() => {
    // Cleanup function for when component unmounts or workflowId changes
    return () => {
      // Clean up event handlers first
      if (cleanupHandlersRef.current) {
        cleanupHandlersRef.current();
        cleanupHandlersRef.current = null;
      }

      // Then disconnect WebSocket
      if (socketRef.current) {
        console.log(
          `🧹 [WebSocket] Cleaning up WebSocket connection for workflow: ${workflowId}`
        );
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [workflowId]);

  // Function to run the workflow
  const runWorkflow = useCallback(
    async (workflowData: WorkflowClient) => {
      try {
        clearNodeExecutionStatuses();
        setCurrentLayer(-1);
        setLayerResults({});

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        console.log(
          `🔧 [WebSocket] Creating new WebSocket instance for workflow: ${workflowId}`
        );
        socketRef.current = new WorkflowWebSocket(workflowId);
        await socketRef.current.connect();

        const unsubscribeMessage = socketRef.current?.on(
          'message',
          (message) => {
            console.log(`📨 [WebSocket] Raw message received:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              message: message,
            });
          }
        );

        // Set up handlers for specific event types
        const unsubscribeStart = socketRef.current?.on(
          'workflow-execution-started',
          (data: WorkflowExecutionStartedData) => {
            console.log(`🚀 [WorkflowExecution] Execution started:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              status: 'executing',
              data,
            });
            setExecutionStatus('executing');
            clearNodeExecutionStatuses();
          }
        );

        const unsubscribeComplete = socketRef.current?.on(
          'workflow-execution-completed',
          (data: WorkflowExecutionCompletedData) => {
            console.log(
              `🎉 [WorkflowExecution] Execution completed successfully:`,
              {
                workflowId,
                timestamp: new Date().toISOString(),
                status: 'completed',
                finalResults: data.results,
                finalNodeStatuses: data.node_statuses,
                totalResults: Object.keys(data.results).length,
              }
            );

            setExecutionStatus('completed');

            // Clean up and disconnect WebSocket after successful completion
            console.log(
              `🔌 [WebSocket] Disconnecting after successful completion for workflow: ${workflowId}`
            );
            if (cleanupHandlersRef.current) {
              cleanupHandlersRef.current();
              cleanupHandlersRef.current = null;
            }
            if (socketRef.current) {
              socketRef.current.disconnect();
              socketRef.current = null;
            }
          }
        );

        const unsubscribeError = socketRef.current?.on(
          'workflow-execution-error',
          (data: WorkflowExecutionErrorData) => {
            console.error(`❌ [WorkflowExecution] Execution failed:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              status: 'error',
              error: data.error,
              failedLayer: data.failed_layer,
              partialResults: data.results,
              finalNodeStatuses: data.node_statuses,
              errorDetails: data,
            });
            setExecutionStatus('error');

            // Update node statuses if provided in error response
            if (data.node_statuses) {
              Object.entries(data.node_statuses).forEach(([nodeId, status]) => {
                updateNodeExecutionStatus(nodeId, status);
              });
            }

            // Clean up and disconnect WebSocket after error/failure
            console.log(
              `🔌 [WebSocket] Disconnecting after error/failure for workflow: ${workflowId}`
            );
            if (cleanupHandlersRef.current) {
              cleanupHandlersRef.current();
              cleanupHandlersRef.current = null;
            }
            if (socketRef.current) {
              socketRef.current.disconnect();
              socketRef.current = null;
            }
          }
        );

        const unsubscribeProgress = socketRef.current?.on(
          'workflow-execution-progress',
          (data: WorkflowExecutionProgressData) => {
            console.log(`📊 [WorkflowExecution] Layer execution progress:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              currentLayer: data.current_layer,
              nodesCompleted: data.nodes_completed,
              layerResults: data.results,
              completedCount: data.nodes_completed.length,
            });

            setCurrentLayer(data.current_layer);
            setLayerResults((prev) => ({
              ...prev,
              [data.current_layer]: data.results,
            }));
          }
        );

        const unsubscribeNodeUpdate = socketRef.current?.on(
          'node-status-update',
          (data: NodeStatusUpdateData) => {
            console.log(`🔄 [NodeStatus] Node status update received:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              nodeStatuses: data.node_statuses,
              statusCount: Object.keys(data.node_statuses).length,
            });

            // Log individual node status changes
            Object.entries(data.node_statuses).forEach(([nodeId, status]) => {
              console.log(`📍 [NodeStatus] Node ${nodeId}: ${status}`, {
                workflowId,
                nodeId,
                status,
                timestamp: new Date().toISOString(),
              });

              updateNodeExecutionStatus(nodeId, status);
            });

            // Log status summary
            const statusSummary = Object.values(data.node_statuses).reduce(
              (acc: Record<string, number>, status) => {
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              },
              {}
            );

            console.log(`📈 [NodeStatus] Status summary:`, {
              workflowId,
              statusSummary,
              totalNodes: Object.keys(data.node_statuses).length,
              timestamp: new Date().toISOString(),
            });
          }
        );

        // Set up error handler
        const unsubscribeSocketError = socketRef.current?.on(
          'error',
          (error) => {
            console.error(`🔥 [WebSocket] Connection error:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              error: error,
              errorMessage: error?.message,
              errorStack: error?.stack,
            });
            setExecutionStatus('error');
          }
        );

        // Store cleanup functions for later use
        const cleanupHandlers = () => {
          console.log(
            `🧹 [WebSocket] Cleaning up event handlers for workflow: ${workflowId}`
          );
          unsubscribeMessage?.();
          unsubscribeStart?.();
          unsubscribeComplete?.();
          unsubscribeError?.();
          unsubscribeProgress?.();
          unsubscribeNodeUpdate?.();
          unsubscribeSocketError?.();
        };

        // Store cleanup function in ref for access from other handlers
        cleanupHandlersRef.current = cleanupHandlers;

        setExecutionStatus('executing');
        console.log(
          `⚡ [WorkflowExecution] Sending execute command to backend:`,
          {
            workflowId,
            timestamp: new Date().toISOString(),
            payload: {
              nodes: workflowData.nodes,
              edges: workflowData.edges,
            },
          }
        );

        socketRef.current.executeWorkflow(
          workflowData.nodes,
          workflowData.edges
        );

        console.log(
          `📡 [WorkflowExecution] Execute command sent successfully for workflow: ${workflowId}`
        );
        return true;
      } catch (error) {
        console.error(`💀 [WorkflowExecution] Error executing workflow:`, {
          workflowId,
          timestamp: new Date().toISOString(),
          error: error,
          errorMessage: (error as Error)?.message,
          errorStack: (error as Error)?.stack,
        });
        setExecutionStatus('error');
        return false;
      }
    },
    [workflowId, clearNodeExecutionStatuses, updateNodeExecutionStatus]
  );

  return {
    currentLayer,
    runWorkflow,
  };
}
