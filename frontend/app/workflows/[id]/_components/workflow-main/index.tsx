'use client';

import React, { useEffect, useRef, useCallback } from 'react';

import useSWR, { mutate } from 'swr';
import { useStore } from './store';
import LoadingWorkflow from '../loader';
import WorkflowError from '@/app/components/workflow/WorkflowError';
import { getWorkflow } from '../../service';
import { useParams } from 'next/navigation';
import StarterSplash from '../starter-splash';
import WorkflowReminder from '../return-splash';
import { WorkflowCompose } from '../workflow-compose';
import WorkflowHeader from '../header';
import { EXECUTIONS_MODE } from './const';
import WorkflowExecution from '../workflow-execution';

const WorkflowMain = () => {
  const params = useParams();
  const setWorkflowId = useStore((state) => state.setWorkflowId);
  let workflowId = useStore((state) => state.workflowId);
  if (params.id && workflowId !== params.id) {
    workflowId = params.id as string;
    setWorkflowId(workflowId);
  }

  const workflows = useStore((state) => state.workflows);

  const isExecutionMode = useStore(
    (state) => state.workflowMode === EXECUTIONS_MODE
  );

  const setSelectedNode = useStore((s) => s.setSelectedNode);

  const setWorkflowName = useStore((state) => state.setWorkflowName);
  const setHasChanges = useStore((state) => state.setHasChanges);
  const setLastSaved = useStore((state) => state.setLastSaved);
  const saveStatus = useStore((state) => state.saveStatus);

  const {
    data: workflowData,
    error,
    isLoading,
  } = useSWR(
    workflowId ? `/api/workflows/${workflowId}` : null,
    () => getWorkflow(workflowId),
    {
      shouldRetryOnError: (err) => {
        if (err.status === 404) {
          return false;
        }
        return true;
      },
      errorRetryCount: 2,
    }
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

  if (!workflowId && workflows) {
    return workflows.length > 0 ? <WorkflowReminder /> : <StarterSplash />;
  }
  if (isLoading || !workflowData) {
    return <LoadingWorkflow />;
  }
  if (error) {
    return <WorkflowError />;
  }

  return (
    <>
      <WorkflowHeader />
      {isExecutionMode ? (
        <WorkflowExecution initialData={workflowData} />
      ) : (
        <WorkflowCompose initialData={workflowData} />
      )}
    </>
  );
};

export default WorkflowMain;
