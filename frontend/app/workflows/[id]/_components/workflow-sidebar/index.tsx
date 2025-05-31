'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, Circuitry } from '@phosphor-icons/react';
import { Workflow } from '@prisma/client';
import { v4 } from 'uuid';
import { useStore } from '../workflow-main/store';

const WorkflowSidebar = () => {
  const router = useRouter();
  const params = useParams();
  const currentWorkflowId = params.id as string;
  const [isCreating, setIsCreating] = useState(false);
  const setWorkflows = useStore((state) => state.setWorkflows);
  const {
    data: workflows,
    isLoading,
    error,
  } = useSWR('/api/workflows', async () => {
    const response = await fetch('/api/workflows');
    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }
    const data = await response.json();
    // Sort by updatedAt descending
    const sortedData = data.sort(
      (a: Workflow, b: Workflow) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    setWorkflows(sortedData);
    return sortedData;
  });

  const handleNewWorkflow = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const newWorkflowId = v4();
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newWorkflowId,
          name: 'New Workflow',
          zoom: 1,
          nodes: [],
          edges: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      const newWorkflow = await response.json();

      // Refresh the workflows list
      mutate('/api/workflows');

      // Navigate to the new workflow
      router.push(`/workflows/${newWorkflow.id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkflowClick = (workflowId: string) => {
    if (workflowId !== currentWorkflowId) {
      router.push(`/workflows/${workflowId}`);
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Workflows</h2>

        {/* New Workflow Button - Updated with theme colors matching the logo */}
        <button
          onClick={handleNewWorkflow}
          disabled={isCreating}
          className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
        >
          <PlusCircle
            size={18}
            weight="bold"
            className={isCreating ? 'animate-spin' : ''}
          />
          <span>{isCreating ? 'Creating...' : 'New Workflow'}</span>
        </button>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse">Loading workflows...</div>
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load workflows
          </div>
        )}

        {workflows && workflows.length === 0 && (
          <div className="p-4 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Circuitry size={24} color="#2563EB" weight="duotone" />
            </div>
            <p className="text-gray-500 text-sm">No workflows yet</p>
          </div>
        )}

        {workflows && workflows.length > 0 && (
          <div className="p-2">
            {workflows.map((workflow: Workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleWorkflowClick(workflow.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 mb-1 ${
                  workflow.id === currentWorkflowId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col">
                  <h3
                    className={`font-medium text-sm truncate mb-1 ${
                      workflow.id === currentWorkflowId
                        ? 'text-blue-700'
                        : 'text-gray-800'
                    }`}
                  >
                    {workflow.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Updated{' '}
                    {formatDistanceToNow(new Date(workflow.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowSidebar;
