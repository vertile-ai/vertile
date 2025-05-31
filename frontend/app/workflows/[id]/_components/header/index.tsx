'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import SaveStatusIcon from '@/app/components/workflow/SaveStatusIcon';
import RunWorkflowButton from '@/app/workflows/[id]/_components/run-workflow';
import { FloppyDisk, Warning } from '@phosphor-icons/react';
import WorkflowNameEditor from './WorkflowNameEditor';
import './style.css';
import { useKeyPress } from 'ahooks';
import { useReactFlow, useStoreApi } from 'reactflow';
import { prepareWorkflowData } from '../../util';
import useSWRMutation from 'swr/mutation';
import { COMPOSE_MODE, EXECUTIONS_MODE } from '../workflow-main/const';
import { getKeyboardKeyCodeBySystem } from '../workflow-internal/utils';

interface WorkflowHeaderProps {
  workflowId: string;
}

const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ workflowId }) => {
  const workflowMode = useStore((s) => s.workflowMode);
  const setWorkflowMode = useStore((s) => s.setWorkflowMode);
  const workflowExecutionStatus = useStore((s) => s.workflowExecutionStatus);
  const hasChanges = useStore((s) => s.hasChanges);
  const saveStatus = useStore((s) => s.saveStatus);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const setHasChanges = useStore((s) => s.setHasChanges);
  const workflowName = useStore((s) => s.workflowName);
  const lastSaved = useStore((s) => s.lastSaved);
  const setLastSaved = useStore((s) => s.setLastSaved);
  const store = useStoreApi();
  const reactflow = useReactFlow();

  // SWR mutation hook for saving new workflow
  const {
    trigger: triggerWorkflowSave,
    isMutating: isSavingWorkflow,
    error: saveWorkflowError,
  } = useSWRMutation(`/api/workflows/${workflowId}`, async (url, { arg }) => {
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
  });

  const {
    trigger: triggerWorkflowUpdate,
    isMutating: isUpdatingWorkflow,
    error: updateWorkflowError,
  } = useSWRMutation(`/api/workflows/${workflowId}`, async (url, { arg }) => {
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
  });

  useEffect(() => {
    setHasChanges(true);
  }, [setHasChanges]);

  // Update mode based on execution status
  useEffect(() => {
    if (
      workflowExecutionStatus !== 'idle' &&
      !hasChanges &&
      workflowMode === COMPOSE_MODE
    ) {
      setWorkflowMode(EXECUTIONS_MODE);
    }
  }, [workflowExecutionStatus, workflowMode, setWorkflowMode, hasChanges]);

  const handleSave = async () => {
    if (!hasChanges) return;

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

    if (lastSaved > 0) {
      await triggerWorkflowUpdate(workflowData as any);
    } else {
      await triggerWorkflowSave(workflowData as any);
    }

    setSaveStatus('saved');
    setLastSaved(Date.now());
    setHasChanges(false);
  };

  useKeyPress(
    `${getKeyboardKeyCodeBySystem('ctrl')}.s`,
    (e) => {
      e.preventDefault();
      handleSave();
    },
    {
      exactMatch: true,
      useCapture: true,
    }
  );

  // Get button content based on save status
  const getSaveButtonContent = () => {
    if (isSavingWorkflow || isUpdatingWorkflow) {
      return (
        <>
          <SaveStatusIcon saveStatus="saving" />
          <span>Saving...</span>
        </>
      );
    }

    if (saveWorkflowError || updateWorkflowError) {
      return (
        <>
          <Warning size={16} className="text-white" />
          <span>Error! Retry</span>
        </>
      );
    }

    return (
      <>
        <FloppyDisk size={16} />
        <span>Save</span>
      </>
    );
  };

  return (
    <div className="flex justify-between items-center h-14 px-4 bg-white border-b border-slate-200 z-10 relative">
      <div className="flex items-center relative z-20">
        <WorkflowNameEditor
          workflowId={workflowId}
          triggerWorkflowSave={triggerWorkflowSave}
          isSavingWorkflow={isSavingWorkflow}
          saveWorkflowError={saveWorkflowError}
          triggerWorkflowUpdate={triggerWorkflowUpdate}
          isUpdatingWorkflow={isUpdatingWorkflow}
          updateWorkflowError={updateWorkflowError}
        />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {hasChanges ? (
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-1 px-2 py-1 text-white rounded text-sm transition-colors relative z-30 shadow-sm hover:shadow hover:-translate-y-px active:translate-y-0 active:shadow-sm ${
                saveStatus === 'error'
                  ? 'bg-red-500 hover:bg-red-600'
                  : saveStatus === 'saving'
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {getSaveButtonContent()}
            </button>
          ) : (
            <>
              <SaveStatusIcon saveStatus="saved" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${workflowMode === COMPOSE_MODE ? 'active' : ''}`}
            onClick={() => {
              if (workflowMode !== COMPOSE_MODE) {
                setWorkflowMode(COMPOSE_MODE);
              }
            }}
          >
            Compose
          </button>
          <button
            className={`toggle-btn ${workflowMode === EXECUTIONS_MODE ? 'active' : ''}`}
            onClick={() => {
              if (workflowMode !== EXECUTIONS_MODE) {
                setWorkflowMode(EXECUTIONS_MODE);
              }
            }}
          >
            Executions
          </button>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 relative z-20">
        <RunWorkflowButton workflowId={workflowId} />
      </div>
    </div>
  );
};

WorkflowHeader.displayName = 'WorkflowHeader';
export default WorkflowHeader;
