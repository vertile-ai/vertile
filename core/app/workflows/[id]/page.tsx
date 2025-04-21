'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ReactFlowProvider } from 'reactflow';
import ConfiguredNodePanel from './_components/node-panel';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { WorkflowContextProvider } from '@/src/components/workflow/context';
import { useStore } from '@/src/components/workflow/store';
import SaveStatusIcon from '@/app/components/workflow/SaveStatusIcon';
import LoadingWorkflow from '@/app/components/workflow/LoadingWorkflow';
import WorkflowError from '@/app/components/workflow/WorkflowError';
import './page.css';
import { NodeSelector } from './_components/node-selector';
import Operator from './_components/operator';
import { useWorkflow } from './hooks';

// Dynamically import the workflow container to avoid SSR issues
const WorkflowInternal = dynamic(() => import('@/src/components/workflow'), {
  ssr: false,
});

// Memoized save message component
const SaveMessage = memo(
  ({
    saveStatus,
    formattedLastSavedTime,
  }: {
    saveStatus: string;
    formattedLastSavedTime: string | null;
  }) => {
    return (
      <span>
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && formattedLastSavedTime
          ? `Last time saved at ${formattedLastSavedTime}`
          : ''}
        {saveStatus === 'error' && 'Failed to save'}
        {saveStatus === 'idle' && 'No changes'}
      </span>
    );
  }
);
SaveMessage.displayName = 'SaveMessage';

const WorkflowPage = () => {
  const params = useParams();
  const workflowId = params?.id as string;
  const { fetchWorkflow } = useWorkflow();
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  // Optimize store selectors to only select what's needed
  const saveStatus = useStore((state) => state.saveStatus);
  const lastSaved = useStore((state) => state.lastSaved);
  const setWorkflowId = useStore((state) => state.setWorkflowId);

  const [formattedLastSavedTime, setFormattedLastSavedTime] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (lastSaved) {
      setFormattedLastSavedTime(
        formatDistanceToNow(lastSaved, { addSuffix: true })
      );
    }
    const intervalId = setInterval(() => {
      if (lastSaved) {
        setFormattedLastSavedTime(
          formatDistanceToNow(lastSaved, { addSuffix: true })
        );
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [lastSaved]);

  // State to track if the panel is open
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Listen for node selection events from the workflow component
  useEffect(() => {
    const handleNodeSelected = (event: CustomEvent) => {
      setSelectedNode(event.detail);
    };

    const handleNodeClearSelection = () => {
      setSelectedNode(null);
      setIsPanelOpen(false);
    };

    // Add custom event listeners
    document.addEventListener(
      'nodeSelected',
      handleNodeSelected as EventListener
    );
    document.addEventListener('nodeClearSelection', handleNodeClearSelection);

    // Clean up on unmount
    return () => {
      document.removeEventListener(
        'nodeSelected',
        handleNodeSelected as EventListener
      );
      document.removeEventListener(
        'nodeClearSelection',
        handleNodeClearSelection
      );
    };
  }, [setSelectedNode]);

  const {
    data: workflowData,
    error,
    isLoading,
  } = useSWR(workflowId ? `/api/workflows/${workflowId}` : null, () =>
    fetchWorkflow(workflowId)
  );

  useEffect(() => {
    if (workflowData) {
      setWorkflowId(workflowId);
    }
  }, [workflowData, setWorkflowId, workflowId]);

  // Handle panel close
  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setSelectedNode(null); // Also clear the selected node when panel is closed
  };

  // Handle click away from panel
  const handleClickAway = useCallback(
    (e: MouseEvent) => {
      if (
        isPanelOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        handlePanelClose();
      }
    },
    [isPanelOpen, setSelectedNode]
  );

  // Set up click away listener
  useEffect(() => {
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickAway);
    } else {
      document.removeEventListener('mousedown', handleClickAway);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isPanelOpen, handleClickAway]);

  // When a node is selected, open the panel
  useEffect(() => {
    if (selectedNode) {
      setIsPanelOpen(true);
    }
  }, [selectedNode]);

  // If loading or error, show loading state
  if (isLoading || (!workflowData && !error)) {
    return <LoadingWorkflow />;
  }

  // If error, show error state
  if (error) {
    return <WorkflowError />;
  }

  return (
    <ReactFlowProvider>
      <div className="workflow-container">
        <div className="status-indicator">
          <SaveStatusIcon saveStatus={saveStatus} />
          <SaveMessage
            saveStatus={saveStatus}
            formattedLastSavedTime={formattedLastSavedTime}
          />
        </div>

        {workflowData && (
          <>
            <WorkflowInternal
              workflowId={workflowId}
              initialData={workflowData}
            />
            <div className="z-[100] absolute top-[36px] left-2">
              <NodeSelector />
            </div>
            <Operator />
          </>
        )}

        {isPanelOpen && (
          <div ref={panelRef} className="config-panel panel-slide-in w-[700px]">
            <ConfiguredNodePanel onClose={handlePanelClose} />
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

const WorkflowPageWithStore = () => {
  return (
    <WorkflowContextProvider>
      <WorkflowPage />
    </WorkflowContextProvider>
  );
};

export default WorkflowPageWithStore;
