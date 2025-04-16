'use client';

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useCallback,
  memo,
  useMemo,
} from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { WorkflowReactFlowProvider } from '@/src/components/workflow';
import ConfiguredNodePanel from '@/src/components/workflow/NodePanelWrapper';
import { useWorkflow } from '@/src/components/workflow/hooks/workflow.hooks';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { WorkflowContextProvider } from '@/src/components/workflow/context';
import { useStore } from '@/src/components/workflow/store';
import SaveStatusIcon from '@/app/components/workflow/SaveStatusIcon';

// Dynamically import the workflow container to avoid SSR issues
const WorkflowContainer = dynamic(() => import('@/src/components/workflow'), {
  ssr: false,
});

// Memoized save message component
const SaveMessage = memo(
  ({
    saveStatus,
    formattedLastSavedTime,
  }: {
    saveStatus: string;
    formattedLastSavedTime: string | null;
  }) => {
    return (
      <span>
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && formattedLastSavedTime
          ? `Last time saved at ${formattedLastSavedTime}`
          : ''}
        {saveStatus === 'error' && 'Failed to save'}
        {saveStatus === 'idle' && 'No changes'}
      </span>
    );
  }
);
SaveMessage.displayName = 'SaveMessage';

const WorkflowPage = () => {
  const params = useParams();
  const workflowId = params?.id as string;
  const { fetchWorkflow } = useWorkflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Optimize store selectors to only select what's needed
  const saveStatus = useStore((state) => state.saveStatus);
  const lastSaved = useStore((state) => state.lastSaved);
  const setWorkflowId = useStore((state) => state.setWorkflowId);

  const [formattedLastSavedTime, setFormattedLastSavedTime] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (lastSaved) {
      setFormattedLastSavedTime(
        formatDistanceToNow(lastSaved, { addSuffix: true })
      );
    }
    const intervalId = setInterval(() => {
      if (lastSaved) {
        setFormattedLastSavedTime(
          formatDistanceToNow(lastSaved, { addSuffix: true })
        );
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [lastSaved]);

  // State to track the selected node
  const [selectedNode, setSelectedNode] = useState(null);

  // State to track if the panel is open
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // After: with SWR
  const {
    data: workflowData,
    error,
    isLoading,
  } = useSWR(workflowId ? `/api/workflows/${workflowId}` : null, () =>
    fetchWorkflow(workflowId)
  );

  useEffect(() => {
    if (workflowData) {
      setWorkflowId(workflowId);
    }
  }, [workflowData, setWorkflowId]);

  // Calculate panel width
  const panelWidth = 320;

  // Handle panel close
  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  // Handle click away from panel
  const handleClickAway = useCallback(
    (e: MouseEvent) => {
      if (
        isPanelOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        handlePanelClose();
      }
    },
    [isPanelOpen]
  );

  // Set up click away listener
  useEffect(() => {
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickAway);
    } else {
      document.removeEventListener('mousedown', handleClickAway);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isPanelOpen, handleClickAway]);

  // When a node is selected, open the panel
  useEffect(() => {
    if (selectedNode) {
      setIsPanelOpen(true);
    }
  }, [selectedNode]);

  return (
    <div className="relative w-full h-full bg-gray-50">
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-sm px-4 py-2 flex items-center gap-2 text-sm">
        <SaveStatusIcon saveStatus={saveStatus} />
        <SaveMessage
          saveStatus={saveStatus}
          formattedLastSavedTime={formattedLastSavedTime}
        />
      </div>

      <WorkflowReactFlowProvider>
        {workflowData && (
          <WorkflowContainer
            workflowId={workflowId}
            initialData={workflowData}
          />
        )}
      </WorkflowReactFlowProvider>

      {isPanelOpen && (
        <div
          ref={panelRef}
          className="absolute right-4 top-4 bottom-4 transition-all duration-300 ease-in-out z-10"
          style={{
            width: `${panelWidth}px`,
            animation: 'slide-in 0.3s ease-out forwards',
          }}
        >
          <ConfiguredNodePanel width={panelWidth} onClose={handlePanelClose} />
        </div>
      )}
      <style jsx>{`
        @keyframes slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const WorkflowPageWithStore = () => {
  return (
    <WorkflowContextProvider>
      <WorkflowPage />
    </WorkflowContextProvider>
  );
};

export default WorkflowPageWithStore;
