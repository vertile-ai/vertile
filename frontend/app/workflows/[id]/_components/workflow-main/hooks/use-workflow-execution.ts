import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { WorkflowWebSocket } from '@/app/lib/api/websocket';
import { EXECUTIONS_MODE } from '../const';

type ExecutionStatus = 'idle' | 'executing' | 'completed' | 'error';

export function useWorkflowExecution(workflowId: string) {
  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus>('idle');
  const [nodeExecutionStatuses, setNodeExecutionStatuses] = useState<
    Record<string, string>
  >({});
  const [executionResults, setExecutionResults] = useState<Record<string, any>>(
    {}
  );
  const [currentLayer, setCurrentLayer] = useState<number>(-1);
  const [layerResults, setLayerResults] = useState<Record<number, any>>({});

  // Workflow store state
  const setWorkflowExecutionStatus = useStore(
    (s) => s.setWorkflowExecutionStatus
  );
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
    setWorkflowExecutionStatus(executionStatus);

    // Switch to pipeline mode when executing
    if (executionStatus === 'executing') {
      setWorkflowMode(EXECUTIONS_MODE);
    }
  }, [executionStatus, setWorkflowExecutionStatus, setWorkflowMode]);

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
        console.log(`🎬 [WorkflowExecution] Starting workflow execution:`, {
          workflowId,
          timestamp: new Date().toISOString(),
          nodeCount: workflowData.nodes?.length || 0,
          edgeCount: workflowData.edges?.length || 0,
          nodes: workflowData.nodes?.map((n) => ({
            id: n.id,
            type: n.data?.type,
          })),
          edges: workflowData.edges?.map((e) => ({
            source: e.source,
            target: e.target,
          })),
        });

        // Clear execution states
        setNodeExecutionStatuses({});
        setExecutionResults({});
        setCurrentLayer(-1);
        setLayerResults({});
        clearNodeExecutionStatuses();

        // Create WebSocket connection if needed
        if (!socketRef.current) {
          console.log(
            `🔧 [WebSocket] Creating new WebSocket instance for workflow: ${workflowId}`
          );
          socketRef.current = new WorkflowWebSocket(workflowId);
        }

        // Connect to WebSocket if not already connected
        if (!socketRef.current.isConnected()) {
          console.log(
            `🔗 [WebSocket] Connecting to WebSocket for workflow: ${workflowId}`
          );
          await socketRef.current.connect();
          console.log(
            `✅ [WebSocket] Connection established for workflow: ${workflowId}`
          );
        }

        // Set up message handler for all messages
        const unsubscribeMessage = socketRef.current?.on(
          'message',
          (message) => {
            console.log(`📨 [WebSocket] Raw message received:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              message: JSON.stringify(message, null, 2),
            });
          }
        );

        // Set up handlers for specific event types
        const unsubscribeStart = socketRef.current?.on(
          'workflow-execution-started',
          (data) => {
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
          (data) => {
            console.log(
              `🎉 [WorkflowExecution] Execution completed successfully:`,
              {
                workflowId,
                timestamp: new Date().toISOString(),
                status: 'completed',
                finalResults: data?.results,
                finalNodeStatuses: data?.node_statuses,
                totalResults: Object.keys(data?.results || {}).length,
              }
            );

            // Update final results
            if (data?.results) {
              setExecutionResults(data.results);
            }

            setExecutionStatus('completed');
          }
        );

        const unsubscribeError = socketRef.current?.on(
          'workflow-execution-error',
          (data) => {
            console.error(`❌ [WorkflowExecution] Execution failed:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              status: 'error',
              error: data?.error,
              errorDetails: data,
            });
            setExecutionStatus('error');
          }
        );

        const unsubscribeProgress = socketRef.current?.on(
          'workflow-execution-progress',
          (data) => {
            console.log(`📊 [WorkflowExecution] Layer execution progress:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              currentLayer: data?.current_layer,
              nodesCompleted: data?.nodes_completed,
              layerResults: data?.results,
              completedCount: data?.nodes_completed?.length || 0,
            });

            if (typeof data?.current_layer === 'number') {
              setCurrentLayer(data.current_layer);
            }

            if (data?.results) {
              setLayerResults((prev) => ({
                ...prev,
                [data.current_layer]: data.results,
              }));
            }
          }
        );

        const unsubscribeNodeUpdate = socketRef.current?.on(
          'node-status-update',
          (data) => {
            console.log(`🔄 [NodeStatus] Node status update received:`, {
              workflowId,
              timestamp: new Date().toISOString(),
              nodeStatuses: data?.node_statuses,
              statusCount: Object.keys(data?.node_statuses || {}).length,
            });

            if (data && data.node_statuses) {
              // Log individual node status changes
              Object.entries(data.node_statuses).forEach(([nodeId, status]) => {
                console.log(`📍 [NodeStatus] Node ${nodeId}: ${status}`, {
                  workflowId,
                  nodeId,
                  status,
                  timestamp: new Date().toISOString(),
                });

                updateNodeExecutionStatus(nodeId, status as string);
                setNodeExecutionStatuses((prev) => ({
                  ...prev,
                  [nodeId]: status as string,
                }));
              });

              // Log status summary
              const statusSummary = Object.values(data.node_statuses).reduce(
                (acc: Record<string, number>, status) => {
                  acc[status as string] = (acc[status as string] || 0) + 1;
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

        // Set status to executing AFTER handlers are set up
        setExecutionStatus('executing');

        // Now execute the workflow - handlers are guaranteed to be in place
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
    executionStatus,
    nodeExecutionStatuses,
    executionResults,
    currentLayer,
    layerResults,
    runWorkflow,
  };
}
