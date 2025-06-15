'use client';

import React from 'react';
import type { FC } from 'react';
import { memo, useEffect, useRef } from 'react';
import { setAutoFreeze } from 'immer';
import { useEventListener } from 'ahooks';
import ReactFlow, {
  Background,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';
import { nodeTypes } from '@/app/workflows/[id]/_components/nodes/const';
import { edgeTypes } from '@/app/workflows/[id]/_components/custom-edge/type';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useNodeExecution } from '@/app/workflows/[id]/_components/workflow-internal/hooks/use-node-execution';

interface WorkflowExecutionProps {
  initialData?: WorkflowClient | null;
}

const WorkflowExecution: FC<WorkflowExecutionProps> = memo(
  ({ initialData }) => {
    const workflowContainerRef = useRef<HTMLDivElement>(null);

    const nodeAnimation = useStore((s) => s.nodeAnimation);
    const setMousePosition = useStore((s) => s.setMousePosition);

    // Hook to update node visuals based on execution status
    useNodeExecution();

    const initialNodes = initialData?.nodes?.map((node) => node.rawData) || [];
    const initialEdges = initialData?.edges?.map((edge) => edge.rawData) || [];

    useEffect(() => {
      setAutoFreeze(false);
      return () => {
        setAutoFreeze(true);
      };
    }, []);

    useEventListener('mousemove', (e) => {
      const containerClientRect =
        workflowContainerRef.current?.getBoundingClientRect();

      if (containerClientRect) {
        setMousePosition({
          pageX: e.clientX,
          pageY: e.clientY,
          elementX: e.clientX - containerClientRect.left,
          elementY: e.clientY - containerClientRect.top,
        });
      }
    });

    const containerClassName = `
    relative w-full h-full workflow-executions-mode
    ${nodeAnimation ? 'workflow-node-animation' : ''}
  `;

    return (
      <div
        id="workflow-execution-container"
        className={containerClassName}
        ref={workflowContainerRef}
      >
        <ReactFlow
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={initialNodes}
          edges={initialEdges}
          // All interactive features disabled for execution mode
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={true}
          panOnScroll={true}
          zoomOnPinch={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={false}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          deleteKeyCode={null}
          minZoom={0.25}
          maxZoom={2}
          fitView={false}
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.Bezier}
        >
          <Background gap={[14, 14]} size={2} color="transparent" />
        </ReactFlow>
      </div>
    );
  }
);

WorkflowExecution.displayName = 'WorkflowExecution';

export default WorkflowExecution;
