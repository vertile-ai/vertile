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

  useEffect(() => {
    setWorkflowExecutionStatus(executionStatus);

    // Switch to pipeline mode when executing
    if (executionStatus === 'executing') {
      setWorkflowMode(EXECUTIONS_MODE);
    }
  }, [executionStatus, setWorkflowExecutionStatus, setWorkflowMode]);

  // Connect to WebSocket for this workflow only when workflow is running
  useEffect(() => {
    if (!workflowId || executionStatus !== 'executing') return;

    // Clear execution states
    setNodeExecutionStatuses({});
    setExecutionResults({});
    clearNodeExecutionStatuses();

    // Create WebSocket connection
    socketRef.current = new WorkflowWebSocket(workflowId);

    // Connect to WebSocket
    socketRef.current
      .connect()
      .then(() => {
        console.log('Connected to WebSocket');

        // Set up message handler for all messages
        const unsubscribeMessage = socketRef.current?.on(
          'message',
          (message) => {
            console.log('WebSocket message:', message);
          }
        );

        // Set up handlers for specific event types
        const unsubscribeStart = socketRef.current?.on(
          'workflow-execution-started',
          () => {
            console.log('Execution started');
            setExecutionStatus('executing');
            clearNodeExecutionStatuses();
          }
        );

        const unsubscribeComplete = socketRef.current?.on(
          'workflow-execution-completed',
          () => {
            console.log('Execution completed');
            setExecutionStatus('completed');
          }
        );

        const unsubscribeError = socketRef.current?.on(
          'workflow-execution-error',
          (data) => {
            console.error('Execution error:', data.error);
            setExecutionStatus('error');
          }
        );

        const unsubscribeNodeUpdate = socketRef.current?.on(
          'node-status-update',
          (data) => {
            if (data && data.node_statuses) {
              Object.entries(data.node_statuses).forEach(([nodeId, status]) => {
                updateNodeExecutionStatus(nodeId, status as string);
                setNodeExecutionStatuses((prev) => ({
                  ...prev,
                  [nodeId]: status as string,
                }));
              });
            }
          }
        );

        // Set up error handler
        const unsubscribeSocketError = socketRef.current?.on(
          'error',
          (error) => {
            console.error('WebSocket error:', error);
            setExecutionStatus('error');
          }
        );

        return () => {
          // Cleanup all event handlers when component unmounts or workflowId changes
          unsubscribeMessage?.();
          unsubscribeStart?.();
          unsubscribeComplete?.();
          unsubscribeError?.();
          unsubscribeNodeUpdate?.();
          unsubscribeSocketError?.();
        };
      })
      .catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        setExecutionStatus('error');
      });
  }, [workflowId, clearNodeExecutionStatuses, updateNodeExecutionStatus]);

  // Function to run the workflow
  const runWorkflow = useCallback(
    async (workflowData: WorkflowClient) => {
      try {
        // Set status to executing
        setExecutionStatus('executing');

        // Ensure socket is connected
        if (!socketRef.current) {
          socketRef.current = new WorkflowWebSocket(workflowId);
        }

        // Connect to WebSocket if not already connected
        if (!socketRef.current.isConnected()) {
          console.log('Connecting to WebSocket');
          await socketRef.current.connect();
        }

        // Execute the workflow
        socketRef.current.executeWorkflow(
          workflowData.nodes,
          workflowData.edges
        );

        return true;
      } catch (error) {
        console.error('Error executing workflow:', error);
        setExecutionStatus('error');
        return false;
      }
    },
    [workflowId]
  );

  return {
    executionStatus,
    nodeExecutionStatuses,
    executionResults,
    runWorkflow,
  };
}
