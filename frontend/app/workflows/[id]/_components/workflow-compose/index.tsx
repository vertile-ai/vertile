'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import './style.css';
import ConfiguredNodePanel from '../node-panel';
import { useStore } from '../workflow-main/store';
import { NodeSelector, NodeSelectorToggle } from '../node-selector';
import Operator from '../operator';
import WorkflowInternal from '../workflow-internal';
import { WorkflowClient } from '@/app/lib/common/workflow.types';

const WorkflowCompose = ({ initialData }: { initialData: WorkflowClient }) => {
  const nodeSelectorVisible = useStore((state) => state.nodeSelectorVisible);
  const setNodeSelectorVisible = useStore(
    (state) => state.setNodeSelectorVisible
  );

  const panelRef = useRef<HTMLDivElement>(null);

  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  useEffect(() => {
    const handleNodeClearSelection = () => {
      setSelectedNode(undefined);
    };

    const handleNodeDoubleClick = (e: CustomEvent) => {
      const { nodeId } = e.detail;
      setSelectedNode(nodeId);
    };

    // Add custom event listeners
    document.addEventListener('nodeClearSelection', handleNodeClearSelection);
    document.addEventListener(
      'nodeDoubleClick',
      handleNodeDoubleClick as EventListener
    );

    // Clean up on unmount
    return () => {
      document.removeEventListener(
        'nodeClearSelection',
        handleNodeClearSelection
      );
      document.removeEventListener(
        'nodeDoubleClick',
        handleNodeDoubleClick as EventListener
      );
    };
  }, [setSelectedNode]);

  // Handle panel close
  const handlePanelClose = () => {
    setSelectedNode(undefined); // Also clear the selected node when panel is closed
  };

  // Handle click away from panel
  const handleClickAway = useCallback(
    (e: MouseEvent) => {
      if (
        selectedNode &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        handlePanelClose();
      }
    },
    [setSelectedNode]
  );

  // Set up click away listener
  useEffect(() => {
    if (selectedNode) {
      document.addEventListener('mousedown', handleClickAway);
    } else {
      document.removeEventListener('mousedown', handleClickAway);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [selectedNode, handleClickAway]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Node Selector Sidebar */}
      {nodeSelectorVisible && (
        <div className="z-[100] absolute left-0 h-full">
          <NodeSelector />
        </div>
      )}

      {/* Workflow Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Floating Node Selector Toggle */}
        {!nodeSelectorVisible && (
          <NodeSelectorToggle onOpen={() => setNodeSelectorVisible(true)} />
        )}

        {
          <>
            <WorkflowInternal initialData={initialData} />
            <Operator />
          </>
        }

        {!!selectedNode && (
          <div ref={panelRef} className="config-panel panel-slide-in w-[700px]">
            <ConfiguredNodePanel onClose={handlePanelClose} />
          </div>
        )}
      </div>
    </div>
  );
};

WorkflowCompose.displayName = 'WorkflowCompose';
export { WorkflowCompose };
