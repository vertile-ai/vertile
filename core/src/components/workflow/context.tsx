import React, { createContext, useContext, useRef } from 'react';
import { createWorkflowStore } from './store';
import { useStore } from './store';

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
