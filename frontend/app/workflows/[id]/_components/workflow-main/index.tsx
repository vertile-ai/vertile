'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import './style.css';

import useSWR, { mutate } from 'swr';
import ConfiguredNodePanel from '../node-panel';
import { useStore } from './store';
import LoadingWorkflow from '../loader';
import WorkflowError from '@/app/components/workflow/WorkflowError';
import { NodeSelector, NodeSelectorToggle } from '../node-selector';
import Operator from '../operator';
import WorkflowHeader from '../header';
import WorkflowInternal from '../workflow-internal';
import { getWorkflow } from '../../service';
import { useParams } from 'next/navigation';
import StarterSplash from '../starter-splash';
import WorkflowReminder from '../return-splash';

const WorkflowMain = () => {
  const params = useParams();
  const setWorkflowId = useStore((state) => state.setWorkflowId);
  let workflowId = useStore((state) => state.workflowId);
  if (params.id && workflowId !== params.id) {
    workflowId = params.id as string;
    setWorkflowId(workflowId);
  }

  const workflows = useStore((state) => state.workflows);
  const nodeSelectorVisible = useStore((state) => state.nodeSelectorVisible);
  const setNodeSelectorVisible = useStore(
    (state) => state.setNodeSelectorVisible
  );

  const panelRef = useRef<HTMLDivElement>(null);

  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  // Optimize store selectors to only select what's needed
  const setWorkflowName = useStore((state) => state.setWorkflowName);
  const setHasChanges = useStore((state) => state.setHasChanges);
  const setLastSaved = useStore((state) => state.setLastSaved);
  const saveStatus = useStore((state) => state.saveStatus);

  // Listen for node selection events from the workflow component
  useEffect(() => {
    const handleNodeClearSelection = () => {
      setSelectedNode(undefined);
    };

    const handleNodeDoubleClick = (e: CustomEvent) => {
      const { nodeId } = e.detail;
      setSelectedNode(nodeId);
    };

    // Add custom event listeners
    document.addEventListener('nodeClearSelection', handleNodeClearSelection);
    document.addEventListener(
      'nodeDoubleClick',
      handleNodeDoubleClick as EventListener
    );

    // Clean up on unmount
    return () => {
      document.removeEventListener(
        'nodeClearSelection',
        handleNodeClearSelection
      );
      document.removeEventListener(
        'nodeDoubleClick',
        handleNodeDoubleClick as EventListener
      );
    };
  }, [setSelectedNode]);

  const {
    data: workflowData,
    error,
    isLoading,
  } = useSWR(workflowId ? `/api/workflows/${workflowId}` : null, () =>
    getWorkflow(workflowId)
  );

  // Watch for save status and refresh data when saved
  useEffect(() => {
    if (saveStatus === 'saved' && workflowId) {
      // Refresh workflow data after successful save
      mutate(`/api/workflows/${workflowId}`);
      // Also refresh the workflows list in the sidebar
      mutate('/api/workflows');
    }
  }, [saveStatus, workflowId]);

  useEffect(() => {
    if (workflowData) {
      if (workflowData.name) {
        setWorkflowName(workflowData.name);
      }
      if (workflowData.createdAt) {
        setLastSaved(new Date(workflowData.createdAt).getTime());
      }
    }
  }, [workflowData, setWorkflowId, setHasChanges, setWorkflowName]);

  // Handle panel close
  const handlePanelClose = () => {
    setSelectedNode(undefined); // Also clear the selected node when panel is closed
  };

  // Handle click away from panel
  const handleClickAway = useCallback(
    (e: MouseEvent) => {
      if (
        selectedNode &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        handlePanelClose();
      }
    },
    [setSelectedNode]
  );

  // Set up click away listener
  useEffect(() => {
    if (selectedNode) {
      document.addEventListener('mousedown', handleClickAway);
    } else {
      document.removeEventListener('mousedown', handleClickAway);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [selectedNode, handleClickAway]);

  if (!workflowId && workflows && !workflows.length) {
    return (
      <div className="h-screen w-full overflow-hidden relative flex flex-col">
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <StarterSplash />
          </div>
        </div>
      </div>
    );
  }

  // If no workflow is selected but workflows exist, show reminder
  if (!workflowId && workflows && workflows.length > 0) {
    return (
      <div className="h-screen w-full overflow-hidden relative flex flex-col">
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <WorkflowReminder />
          </div>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading || !workflowData) {
    return (
      <div className="h-screen w-full overflow-hidden relative flex flex-col">
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <LoadingWorkflow />
          </div>
        </div>
      </div>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <div className="h-screen w-full overflow-hidden relative flex flex-col">
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <WorkflowError />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden relative flex flex-col">
      {/* Header */}
      <WorkflowHeader workflowId={workflowId} />

      {/* Main content area with sidebar and workflow */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Selector Sidebar */}
        {nodeSelectorVisible && (
          <div className="z-[100] absolute left-0 h-full">
            <NodeSelector />
          </div>
        )}

        {/* Workflow Content Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Floating Node Selector Toggle */}
          {!nodeSelectorVisible && (
            <NodeSelectorToggle onOpen={() => setNodeSelectorVisible(true)} />
          )}

          {
            <>
              <WorkflowInternal initialData={workflowData} />
              <Operator />
            </>
          }

          {!!selectedNode && (
            <div
              ref={panelRef}
              className="config-panel panel-slide-in w-[700px]"
            >
              <ConfiguredNodePanel onClose={handlePanelClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowMain;
