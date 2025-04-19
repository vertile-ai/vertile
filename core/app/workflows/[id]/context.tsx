'use client';
import React, { createContext, useContext, useRef } from 'react';
import { createWorkflowStore } from '@/src/components/workflow/store';
import { useStore } from '@/src/components/workflow/store';

type WorkflowStore = ReturnType<typeof createWorkflowStore>;

// The context provides the store
export const WorkflowContext = createContext<WorkflowStore | null>(null);

// Simple hook to use the workflow context
export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error(
      'useWorkflowContext must be used within a WorkflowContextProvider'
    );
  }
  return context;
};

// Custom hook for selected node functionality
export const useSelectedNode = () => {
  const selectedNode = useStore((state) => state.selectedNode);
  const setSelectedNode = useStore((state) => state.setSelectedNode);

  return { selectedNode, setSelectedNode };
};

// Props for the provider
type WorkflowProviderProps = {
  children: React.ReactNode;
};

// Provider component that initializes the store and provides it
export const WorkflowContextProvider = ({
  children,
}: WorkflowProviderProps) => {
  const storeRef = useRef<WorkflowStore>();

  // Create the store if it doesn't exist
  if (!storeRef.current) {
    storeRef.current = createWorkflowStore();
  }

  return (
    <WorkflowContext.Provider value={storeRef.current}>
      {children}
    </WorkflowContext.Provider>
  );
};
