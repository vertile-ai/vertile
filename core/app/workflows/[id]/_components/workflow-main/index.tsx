'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './style.css';

import useSWR, { mutate } from 'swr';
import { ReactFlowProvider } from 'reactflow';
import ConfiguredNodePanel from '../node-panel';
import { useStore } from './store';
import LoadingWorkflow from '@/app/components/workflow/LoadingWorkflow';
import WorkflowError from '@/app/components/workflow/WorkflowError';
import { NodeSelector } from '../node-selector';
import Operator from '../operator';
import WorkflowHeader from '../header';
import WorkflowInternal from '../workflow-internal';
import { v4 } from 'uuid';
import { getWorkflow } from '../../service';
import { useParams } from 'next/navigation';

const WorkflowMain = ({ isNew }: { isNew?: boolean }) => {
  const params = useParams();
  let workflowId = useStore((state) => state.workflowId);
  if (!workflowId && isNew) {
    workflowId = v4();
  }
  if (params.id && !workflowId) {
    workflowId = params.id as string;
  }

  const panelRef = useRef<HTMLDivElement>(null);

  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  // Optimize store selectors to only select what's needed
  const setWorkflowId = useStore((state) => state.setWorkflowId);
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
  } = useSWR(!isNew && workflowId ? `/api/workflows/${workflowId}` : null, () =>
    getWorkflow(workflowId)
  );

  // Watch for save status and refresh data when saved
  useEffect(() => {
    if (saveStatus === 'saved' && workflowId && !isNew) {
      // Refresh workflow data after successful save
      mutate(`/api/workflows/${workflowId}`);
    }
  }, [saveStatus, isNew]);

  useEffect(() => {
    if (workflowData && !isNew) {
      if (workflowData.name) {
        setWorkflowName(workflowData.name);
      }
      if (workflowData.createdAt) {
        setLastSaved(new Date(workflowData.createdAt).getTime());
      }
    } else if (isNew) {
      setWorkflowName('New Workflow');
      setHasChanges(true);
    }
  }, [workflowData, setWorkflowId, isNew, setHasChanges, setWorkflowName]);

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

  // If loading or error, show loading state
  if (!isNew && (isLoading || (!workflowData && !error))) {
    return <LoadingWorkflow />;
  }

  // If error, show error state
  if (!isNew && error) {
    return <WorkflowError />;
  }

  return (
    <ReactFlowProvider>
      <div className="workflow-container">
        <WorkflowHeader workflowId={workflowId} isNew={!!isNew} />

        {(!!workflowData || !!isNew) && (
          <>
            <WorkflowInternal
              workflowId={workflowId}
              initialData={workflowData}
            />
            <div className="z-[100] absolute top-20 left-8">
              <NodeSelector />
            </div>
            <Operator />
          </>
        )}

        {!!selectedNode && (
          <div ref={panelRef} className="config-panel panel-slide-in w-[700px]">
            <ConfiguredNodePanel onClose={handlePanelClose} />
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowMain;
