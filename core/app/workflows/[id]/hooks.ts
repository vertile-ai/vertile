'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { WorkflowClient } from '@/app/lib/common/workflow.types';

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single workflow by ID
  const fetchWorkflow = useCallback(
    async (id: string): Promise<WorkflowClient | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workflows/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create a new workflow
  const createWorkflow = async (data: any): Promise<WorkflowClient | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing workflow
  const updateWorkflow = useCallback(
    async (id: string, data: any): Promise<WorkflowClient | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/workflows/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok || response.status >= 400) {
          const errorData = await response.json();
          console.warn('Failed to patch workflow', errorData);
          return null;
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchWorkflow,
    createWorkflow,
    updateWorkflow,
  };
}

// Hook for automatic workflow saving
export function useAutoSaveWorkflow(workflowId: string) {
  const { updateWorkflow } = useWorkflow();
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const workflowDataRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to trigger a save
  const saveWorkflow = useCallback(
    (data: any) => {
      if (!workflowId) return;

      // Store the latest data
      workflowDataRef.current = data;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to save after delay
      timeoutRef.current = setTimeout(async () => {
        if (!workflowDataRef.current) return;

        try {
          setSaveStatus('saving');
          await updateWorkflow(workflowId, workflowDataRef.current);
          setLastSaved(new Date());
          setSaveStatus('saved');
        } catch (err) {
          console.error('Error saving workflow:', err);
          setSaveStatus('error');
        }
      }, 2000); // 2 second delay before saving
    },
    [workflowId, updateWorkflow]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    saveWorkflow,
  };
}
