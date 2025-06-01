import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useState } from 'react';

import { useCallback } from 'react';

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
        console.log('response', response);
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        console.error('Error occurred while fetching workflow', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
      return null;
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
