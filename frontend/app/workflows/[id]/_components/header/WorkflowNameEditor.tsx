'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { Pencil, Spinner } from '@phosphor-icons/react';
import useSWRMutation from 'swr/mutation';
import { prepareWorkflowData } from '../../util';
import { useStoreApi } from 'reactflow';
import { useReactFlow } from 'reactflow';

interface WorkflowNameEditorProps {
  workflowId: string;
  triggerWorkflowSave: (workflowData: any) => Promise<any>;
  isSavingWorkflow: boolean;
  saveWorkflowError: Error | null;
  triggerWorkflowUpdate: (workflowData: any) => Promise<any>;
  isUpdatingWorkflow: boolean;
  updateWorkflowError: Error | null;
}

const WorkflowNameEditor: React.FC<WorkflowNameEditorProps> = ({
  workflowId,
  triggerWorkflowSave,
  isSavingWorkflow,
  saveWorkflowError,
  triggerWorkflowUpdate,
  isUpdatingWorkflow,
  updateWorkflowError,
}) => {
  const workflowName = useStore((s) => s.workflowName);
  const isAnonymous = !workflowName;

  const hasChanges = useStore((s) => s.hasChanges);
  const setHasChanges = useStore((s) => s.setHasChanges);
  const saveStatus = useStore((s) => s.saveStatus);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const setWorkflowName = useStore((s) => s.setWorkflowName);
  const setLastSaved = useStore((s) => s.setLastSaved);

  const store = useStoreApi();
  const reactflow = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(workflowName);
  const inputRef = useRef<HTMLInputElement>(null);

  // SWR mutation hook for updating workflow name
  const {
    trigger: triggerNameUpdate,
    isMutating: isUpdatingName,
    error: updateNameError,
  } = useSWRMutation(
    `/api/workflows/${workflowId}/name`,
    async (url, { arg }) => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow name');
      }

      return response.json();
    }
  );

  // Update local state when store changes
  useEffect(() => {
    setEditedName(workflowName);
  }, [workflowName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleSaveName = async () => {
    if (editedName.trim() === '' || editedName === workflowName) {
      setEditedName(workflowName); // Revert to original if empty
      setIsEditing(false);
      return;
    }

    // Update the save status in the store
    try {
      setSaveStatus('saving');
      const { getNodes } = store.getState();
      const currentNodes = getNodes();
      const { edges: currentEdges } = store.getState();
      const { getViewport } = reactflow;
      const currentViewport = getViewport();

      const workflowData = prepareWorkflowData({
        viewport: currentViewport,
        nodes: currentNodes,
        edges: currentEdges,
        name: editedName,
      });

      if (!isAnonymous) {
        if (hasChanges) {
          await triggerWorkflowUpdate(workflowData);
        } else {
          await triggerNameUpdate({
            name: editedName,
          } as any);
        }
      } else {
        await triggerWorkflowSave(workflowData);
        setHasChanges(false);
        setLastSaved(Date.now());
      }
      setWorkflowName(editedName);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving workflow name:', error);
      setSaveStatus('error');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditedName(workflowName); // Revert changes
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSaveName();
  };

  // Determine if we're in a saving state
  const isSaving =
    isUpdatingName || isSavingWorkflow || saveStatus === 'saving';

  return (
    <div className="flex items-center mr-4 border-r border-slate-200 pr-4">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={handleNameChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-40 px-2 py-1 text-sm font-medium text-slate-800 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Workflow name"
          maxLength={50}
          disabled={isSaving}
        />
      ) : (
        <div
          className="flex items-center group cursor-pointer max-w-[180px]"
          onClick={handleStartEditing}
          title="Edit workflow name"
        >
          <h2 className="text-sm font-semibold text-slate-800 mr-1 truncate hover:text-indigo-600 transition-colors">
            {workflowName || 'Untitled'}
          </h2>
          {isSaving ? (
            <Spinner size={14} className="animate-spin text-indigo-500" />
          ) : (
            <Pencil
              size={14}
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity group-hover:text-indigo-600"
            />
          )}
        </div>
      )}
    </div>
  );
};

WorkflowNameEditor.displayName = 'WorkflowNameEditor';

export default memo(WorkflowNameEditor);
