'use client';

import React, { useEffect, useRef, useState, createContext, useCallback } from 'react';
import Workflow from '@/src/components/workflow';
import { WorkflowReactFlowProvider } from '@/src/components/workflow';
import WorkflowContainer from '@/src/components/workflow';
import ConfiguredNodePanel from '@/src/components/workflow/NodePanelWrapper';

// Create context to share selected node state across components
export const SelectedNodeContext = createContext({
  selectedNode: null,
  setSelectedNode: (node: any) => {},
});

const WorkflowPage = () => {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // State to track the selected node
  const [selectedNode, setSelectedNode] = useState(null);
  
  // State to track if the panel is open
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Use state for window dimensions with initial values
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Update window dimensions on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      // Set initial dimensions
      handleResize();

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Calculate panel width
  const panelWidth = 320;
  
  // Handle panel close
  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  // Handle click away from panel
  const handleClickAway = useCallback((e: MouseEvent) => {
    if (isPanelOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
      handlePanelClose();
    }
  }, [isPanelOpen]);
  
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

  // Expose the context to the window for access from other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectedNodeContext = { selectedNode, setSelectedNode };

      return () => {
        delete (window as any).selectedNodeContext;
      };
    }
  }, [selectedNode, setSelectedNode]);

  return (
    <SelectedNodeContext.Provider value={{ selectedNode, setSelectedNode }}>
      <div className="relative w-full h-screen bg-gray-50">
        {/* Main workflow area - full width and height */}
        <div className="w-full h-full">
          <WorkflowReactFlowProvider>
            <WorkflowContainer />
          </WorkflowReactFlowProvider>
        </div>
        
        {/* Floating Node configuration panel */}
        {isPanelOpen && (
          <div 
            ref={panelRef}
            className="absolute right-4 top-4 bottom-4 transition-all duration-300 ease-in-out z-10"
            style={{ 
              width: `${panelWidth}px`,
              animation: 'slide-in 0.3s ease-out forwards',
            }}
          >
            <ConfiguredNodePanel 
              width={panelWidth} 
              onClose={handlePanelClose} 
            />
          </div>
        )}

        {/* Add CSS animation for panel */}
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
    </SelectedNodeContext.Provider>
  );
};

export default WorkflowPage;
