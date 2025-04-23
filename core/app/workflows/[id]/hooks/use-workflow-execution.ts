import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useStore } from '@/src/components/workflow/store';
import { WorkflowWebSocket } from '@/app/lib/api/websocket';
import { NodeRunningStatus } from '../types';

type ExecutionStatus = 'idle' | 'executing' | 'completed' | 'error';

export function useWorkflowExecution(workflowId: string) {
  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus>('idle');
  const [executionResults, setExecutionResults] = useState<any>(null);
  const socketRef = useRef<WorkflowWebSocket | null>(null);

  // Get and set node execution statuses from the workflow store
  const nodeExecutionStatuses = useStore((s) => s.nodeExecutionStatuses);
  const setNodeExecutionStatuses = useStore((s) => s.setNodeExecutionStatuses);
  const updateNodeExecutionStatus = useStore(
    (s) => s.updateNodeExecutionStatus
  );
  const setWorkflowExecutionStatus = useStore(
    (s) => s.setWorkflowExecutionStatus
  );

  // Update the global workflow execution status when our local status changes
  useEffect(() => {
    setWorkflowExecutionStatus(executionStatus);
  }, [executionStatus, setWorkflowExecutionStatus]);

  // Initialize WebSocket and set up event handlers
  useEffect(() => {
    // Only initialize if we don't already have a socket
    if (!socketRef.current) {
      const socket = new WorkflowWebSocket(workflowId, {
        autoReconnect: false,
      });
      socketRef.current = socket;

      // Set up event handlers for different WebSocket events
      socket.on('workflow-execution-started', () => {
        setExecutionStatus('executing');
        setNodeExecutionStatuses({});
        setExecutionResults(null);
      });

      socket.on('node-status-update', (data) => {
        const { node_statuses } = data;

        console.log('Received node status update:', node_statuses);

        if (node_statuses) {
          // Convert python status strings to frontend NodeRunningStatus enum
          const updatedStatuses: Record<string, NodeRunningStatus> = {};

          Object.entries(node_statuses).forEach(([nodeId, status]) => {
            // Map backend status strings to frontend NodeRunningStatus enum
            switch (status) {
              case 'not-start':
                updatedStatuses[nodeId] = NodeRunningStatus.NotStart;
                break;
              case 'waiting':
                updatedStatuses[nodeId] = NodeRunningStatus.Waiting;
                break;
              case 'running':
                updatedStatuses[nodeId] = NodeRunningStatus.Running;
                break;
              case 'succeeded':
                updatedStatuses[nodeId] = NodeRunningStatus.Succeeded;
                break;
              case 'failed':
                updatedStatuses[nodeId] = NodeRunningStatus.Failed;
                break;
              default:
                updatedStatuses[nodeId] = NodeRunningStatus.NotStart;
            }
          });

          setNodeExecutionStatuses(updatedStatuses);
        }
      });

      socket.on('workflow-execution-progress', (data) => {
        const { current_layer, nodes_completed, results } = data;
        console.log(
          `Executing layer ${current_layer}, nodes completed: ${nodes_completed?.length || 0}`
        );
      });

      socket.on('workflow-execution-completed', (data) => {
        setExecutionStatus('completed');
        setExecutionResults(data.results);

        // Update any final node statuses if provided
        if (data.node_statuses) {
          const updatedStatuses: Record<string, NodeRunningStatus> = {};

          Object.entries(data.node_statuses).forEach(([nodeId, status]) => {
            switch (status) {
              case 'succeeded':
                updatedStatuses[nodeId] = NodeRunningStatus.Succeeded;
                break;
              case 'failed':
                updatedStatuses[nodeId] = NodeRunningStatus.Failed;
                break;
              default:
                // Keep other statuses as is
                if (nodeExecutionStatuses[nodeId]) {
                  updatedStatuses[nodeId] = nodeExecutionStatuses[
                    nodeId
                  ] as NodeRunningStatus;
                }
            }
          });

          setNodeExecutionStatuses(updatedStatuses);
        }
      });

      socket.on('workflow-execution-error', (data) => {
        setExecutionStatus('error');
        console.error(`Workflow execution error: ${data.error}`);
      });

      socket.on('error', (data) => {
        console.error('WebSocket error from server:', data);
      });
    }
  }, [
    workflowId,
    setNodeExecutionStatuses,
    nodeExecutionStatuses,
    updateNodeExecutionStatus,
  ]);

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
