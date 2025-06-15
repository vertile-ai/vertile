'use client';

import React, { useState } from 'react';
import { useReactFlow, useStoreApi } from 'reactflow';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { useWorkflowExecution } from '@/app/workflows/[id]/_components/workflow-main/hooks/use-workflow-execution';
import { PlayIcon } from '@heroicons/react/24/solid';
import { EXECUTIONS_MODE } from '../workflow-main/const';
import { prepareWorkflowData } from '../../util';
import useSWRMutation from 'swr/mutation';

interface RunWorkflowButtonProps {
  workflowId: string;
}

const RunWorkflowButton: React.FC<RunWorkflowButtonProps> = ({
  workflowId,
}) => {
  const reactflow = useReactFlow();
  const store = useStoreApi();
  const saveStatus = useStore((s) => s.saveStatus);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const setWorkflowMode = useStore((s) => s.setWorkflowMode);
  const executionStatus = useStore((s) => s.workflowExecutionStatus);
  const hasChanges = useStore((s) => s.hasChanges);
  const setHasChanges = useStore((s) => s.setHasChanges);
  const workflowName = useStore((s) => s.workflowName);
  const lastSaved = useStore((s) => s.lastSaved);
  const setLastSaved = useStore((s) => s.setLastSaved);
  const workflow = useStore((s) =>
    s.workflows?.find((w) => w.id === workflowId)
  );

  const { runWorkflow } = useWorkflowExecution(workflowId);
  const [isHovered, setIsHovered] = useState(false);

  // SWR mutation hooks for saving workflow
  const { trigger: triggerWorkflowSave } = useSWRMutation(
    `/api/workflows/${workflowId}`,
    async (url, { arg }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      return response.json();
    }
  );

  const { trigger: triggerWorkflowUpdate } = useSWRMutation(
    `/api/workflows/${workflowId}`,
    async (url, { arg }) => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      return response.json();
    }
  );

  const saveWorkflow = async () => {
    if (!hasChanges) return;

    setSaveStatus('saving');

    const { getNodes } = store.getState();
    const currentNodes = getNodes();
    const { edges: currentEdges } = store.getState();
    const { getViewport } = reactflow;
    const currentViewport = getViewport();

    const workflowData = prepareWorkflowData({
      name: workflowName,
      viewport: currentViewport,
      nodes: currentNodes,
      edges: currentEdges,
    });

    try {
      if (lastSaved > 0) {
        await triggerWorkflowUpdate(workflowData as any);
      } else {
        await triggerWorkflowSave(workflowData as any);
      }

      setSaveStatus('saved');
      setLastSaved(Date.now());
      setHasChanges(false);
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  };

  const handleRunWorkflow = async () => {
    if (executionStatus === 'executing') return;
    if (saveStatus === 'saving') return;

    try {
      // Save the current workflow status first
      await saveWorkflow();

      // Change to pipeline mode when running workflow
      setWorkflowMode(EXECUTIONS_MODE);

      // Get current workflow data
      const { getNodes } = store.getState();
      const nodes = getNodes();
      const { edges } = store.getState();
      const { getViewport } = reactflow;

      // Create workflow data object
      const workflowData = {
        id: workflowId,
        name: workflow!.name,
        zoom: getViewport().zoom,
        nodes: nodes,
        edges: edges,
      };

      // Run the workflow
      await runWorkflow(workflowData as any);
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  };

  // Determine button color based on status
  const getButtonColor = () => {
    if (executionStatus === 'executing') return 'bg-yellow-500';
    if (executionStatus === 'completed') return 'bg-green-500';
    if (executionStatus === 'error') return 'bg-red-500';
    return isHovered ? 'bg-indigo-600' : 'bg-indigo-500';
  };

  // Determine button tooltip based on status
  const getButtonTooltip = () => {
    if (executionStatus === 'executing') return 'Executing workflow...';
    if (executionStatus === 'completed')
      return 'Workflow executed successfully';
    if (executionStatus === 'error') return 'Error executing workflow';
    if (saveStatus === 'saving') return 'Please wait until saving is complete';
    return 'Run workflow';
  };

  // Button icon based on status
  const ButtonIcon = () => {
    if (executionStatus === 'executing') {
      return (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
    }
    return <PlayIcon className="h-5 w-5" />;
  };

  return (
    <button
      className={`ml-2 p-1.5 flex items-center justify-center rounded-md text-white transition-colors ${getButtonColor()} ${
        executionStatus === 'executing' || saveStatus === 'saving'
          ? 'cursor-not-allowed opacity-70'
          : 'hover:bg-indigo-600'
      }`}
      title={getButtonTooltip()}
      disabled={executionStatus === 'executing' || saveStatus === 'saving'}
      onClick={handleRunWorkflow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Run workflow"
    >
      <ButtonIcon />
    </button>
  );
};

export default RunWorkflowButton;
