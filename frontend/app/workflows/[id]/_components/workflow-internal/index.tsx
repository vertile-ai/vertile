'use client';

import React from 'react';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import produce, { setAutoFreeze } from 'immer';
import { useEventListener, useKeyPress } from 'ahooks';
import ReactFlow, {
  Background,
  SelectionMode,
  ConnectionLineType,
  useReactFlow,
  useStoreApi,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './style.css';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import CustomNode from '@/app/workflows/[id]/_components/nodes';
import {
  useNodesInteractions,
  useNodesReadOnly,
  usePanelInteractions,
  useWorkflow,
} from './hooks/hooks';
import CustomEdge from './custom-edge';
import CustomConnectionLine from './custom-connection-line';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { generateNewNode, getKeyboardKeyCodeBySystem } from './utils';
import { useEdgesInteractions } from './hooks/use-edges-interactions';
import { useSelectionInteractions } from './hooks/use-selection-interactions';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { useNodeExecution } from './hooks/use-node-execution';
import {
  EXECUTIONS_MODE,
  ITERATION_CHILDREN_Z_INDEX,
  NODES_INITIAL_DATA,
} from '@/app/workflows/[id]/_components/workflow-main/const';

// Define nodeTypes and edgeTypes outside the component to prevent recreating on every render
const nodeTypes: Record<'custom', React.FC> = {
  custom: CustomNode,
};

const edgeTypes: Record<'custom', React.FC> = {
  custom: CustomEdge,
};

interface WorkflowProps {
  initialData?: WorkflowClient | null;
}

const WorkflowInternal: FC<WorkflowProps> = memo(({ initialData }) => {
  const workflowContainerRef = useRef<HTMLDivElement>(null);

  const controlMode = useStore((s) => s.controlMode);
  const nodeAnimation = useStore((s) => s.nodeAnimation);
  const workflowMode = useStore((s) => s.workflowMode);
  const setMousePosition = useStore((s) => s.setMousePosition);

  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const setHasChanges = useStore((s) => s.setHasChanges);

  const { nodesReadOnly } = useNodesReadOnly();
  const store = useStoreApi();
  const reactflow = useReactFlow();

  const isReadOnly = nodesReadOnly || workflowMode === EXECUTIONS_MODE;

  const {
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeEnter,
    handleNodeLeave,
    handleNodeClick,
    handleNodeConnect,
    handleNodeConnectStart,
    handleNodeConnectEnd,
    handleNodeContextMenu,
    handleNodesCopy,
    handleNodesPaste,
    handleNodesDuplicate,
    handleNodeDelete,
  } = useNodesInteractions();

  const {
    handleEdgeEnter,
    handleEdgeLeave,
    handleEdgeDelete,
    handleEdgesChange,
  } = useEdgesInteractions();

  const { handleSelectionStart, handleSelectionChange, handleSelectionDrag } =
    useSelectionInteractions();

  const { handlePaneContextMenu } = usePanelInteractions();
  const { isValidConnection } = useWorkflow();

  // Hook to update node visuals based on execution status
  useNodeExecution();

  const markHasChanges = useCallback(() => {
    setHasChanges(true);
    setSaveStatus('unsaved');
  }, [setHasChanges, setSaveStatus]);

  const memoizedHandleNodeConnect = useMemo(() => {
    return (connection: any) => {
      if (handleNodeConnect) {
        handleNodeConnect(connection);
      }
      markHasChanges();
    };
  }, [handleNodeConnect, markHasChanges]);

  const memoizedHandleEdgesChange = useMemo(() => {
    return (changes: any) => {
      if (handleEdgesChange) {
        handleEdgesChange(changes);
      }
      markHasChanges();
    };
  }, [handleEdgesChange, markHasChanges]);

  // Memoize hover handlers to prevent unnecessary rerenders
  const memoizedHandleNodeEnter = useMemo(
    () => handleNodeEnter,
    [handleNodeEnter]
  );
  const memoizedHandleNodeLeave = useMemo(
    () => handleNodeLeave,
    [handleNodeLeave]
  );
  const memoizedHandleEdgeEnter = useMemo(
    () => handleEdgeEnter,
    [handleEdgeEnter]
  );
  const memoizedHandleEdgeLeave = useMemo(
    () => handleEdgeLeave,
    [handleEdgeLeave]
  );

  const { getNodes } = store.getState();
  const nodes = getNodes();

  // Track node drag for changes
  const memoizedHandleNodeDrag = useMemo(() => {
    return (event: any, node: any) => {
      if (handleNodeDrag) {
        handleNodeDrag(event, node, nodes);
      }
      markHasChanges();
    };
  }, [handleNodeDrag, markHasChanges, nodes]);

  // Handle DnD for node creation
  const handleNodeDrop = useCallback(
    (type: BlockEnum, position: { x: number; y: number }) => {
      // Don't allow node creation in executions mode
      if (workflowMode === EXECUTIONS_MODE) return;

      const { getNodes } = store.getState();
      const nodes = getNodes();
      const nodesWithSameType = nodes.filter((node) => node.data.type === type);

      // Get the workflow container's bounding rect
      const containerRect =
        workflowContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate the position relative to the workflow container
      const relativeX = position.x;
      const relativeY = position.y;

      const newNode = generateNewNode({
        data: {
          ...NODES_INITIAL_DATA[type],
          title:
            nodesWithSameType.length > 0
              ? `${type} ${nodesWithSameType.length + 1}`
              : type,
          isCandidate: true,
        } as any,
        position: {
          x: relativeX,
          y: relativeY,
        },
      });

      const { screenToFlowPosition } = reactflow;

      // This handles sidebar and header offset
      const { x, y } = screenToFlowPosition({
        x: relativeX,
        y: relativeY,
      });

      const newNodes = produce(nodes, (draft) => {
        draft.push({
          ...newNode,
          data: { ...newNode.data },
          position: {
            x: x,
            y: y,
          },
        });
      });

      markHasChanges();
      const { setNodes } = store.getState();
      setNodes(newNodes);
    },
    [reactflow, store, workflowMode, markHasChanges]
  );

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

  useKeyPress('delete', handleEdgeDelete);
  useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.c`, handleNodesCopy, {
    exactMatch: true,
    useCapture: true,
  });
  useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.v`, handleNodesPaste, {
    exactMatch: true,
    useCapture: true,
  });
  useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.d`, handleNodesDuplicate, {
    exactMatch: true,
    useCapture: true,
  });

  useKeyPress(
    `${getKeyboardKeyCodeBySystem('backspace')}`,
    () => {
      const { getNodes } = store.getState();
      const instantNodes = getNodes();
      const selectedNode = instantNodes.find((node) => node.data.selected);
      if (selectedNode) {
        handleNodeDelete(selectedNode.id);
      }
    },
    {
      exactMatch: true,
      useCapture: true,
    }
  );

  // Apply executions-specific styles if in executions mode
  const containerClassName = `
    relative w-full h-full
    ${nodeAnimation && 'workflow-node-animation'}
    ${workflowMode === EXECUTIONS_MODE ? 'workflow-executions-mode' : ''}
  `;

  // Memoize ReactFlow props to prevent unnecessary rerenders
  const reactFlowProps = useMemo(
    () => ({
      nodeTypes,
      edgeTypes,
      nodes: initialNodes,
      edges: initialEdges,
      onNodeDragStart: handleNodeDragStart,
      onNodeDrag: memoizedHandleNodeDrag,
      onNodeMouseEnter: memoizedHandleNodeEnter,
      onNodeMouseLeave: memoizedHandleNodeLeave,
      onNodeClick: handleNodeClick,
      onNodeContextMenu: handleNodeContextMenu,
      onConnect: memoizedHandleNodeConnect,
      onConnectStart: handleNodeConnectStart,
      onConnectEnd: handleNodeConnectEnd,
      onEdgeMouseEnter: memoizedHandleEdgeEnter,
      onEdgeMouseLeave: memoizedHandleEdgeLeave,
      onEdgesChange: memoizedHandleEdgesChange,
      onSelectionStart: handleSelectionStart,
      onSelectionChange: handleSelectionChange,
      onSelectionDrag: handleSelectionDrag,
      onPaneContextMenu: handlePaneContextMenu,
      connectionLineType: ConnectionLineType.Bezier,
      connectionLineStyle: { stroke: '#6366f1', strokeWidth: 2 },
      connectionLineComponent: CustomConnectionLine,
      connectionLineContainerStyle: { zIndex: ITERATION_CHILDREN_Z_INDEX },
      multiSelectionKeyCode: null,
      nodesDraggable: !isReadOnly,
      nodesConnectable: !isReadOnly,
      nodesFocusable: !isReadOnly,
      edgesFocusable: !isReadOnly,
      panOnDrag: controlMode === 'hand' || workflowMode === EXECUTIONS_MODE,
      zoomOnPinch: true,
      zoomOnScroll: true,
      zoomOnDoubleClick: true,
      isValidConnection: isValidConnection,
      selectionKeyCode: null,
      selectionMode: SelectionMode.Partial,
      selectionOnDrag:
        controlMode === 'pointer' && workflowMode !== EXECUTIONS_MODE,
      minZoom: 0.25,
      fitView: false,
      fitViewOptions: { padding: 0.2 },
      proOptions: { hideAttribution: true },
    }),
    [
      handleNodeDragStart,
      memoizedHandleNodeDrag,
      memoizedHandleNodeEnter,
      memoizedHandleNodeLeave,
      handleNodeClick,
      handleNodeContextMenu,
      memoizedHandleNodeConnect,
      handleNodeConnectStart,
      handleNodeConnectEnd,
      memoizedHandleEdgeEnter,
      memoizedHandleEdgeLeave,
      memoizedHandleEdgesChange,
      handleSelectionStart,
      handleSelectionChange,
      handleSelectionDrag,
      handlePaneContextMenu,
      isReadOnly,
      controlMode,
      isValidConnection,
      workflowMode,
    ]
  );

  return (
    <div
      id="workflow-container"
      className={containerClassName}
      ref={workflowContainerRef}
      onDragOver={(e) => {
        if (workflowMode === EXECUTIONS_MODE) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('bg-indigo-50', 'bg-opacity-30');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('bg-indigo-50', 'bg-opacity-30');
      }}
      onDrop={(e) => {
        if (workflowMode === EXECUTIONS_MODE) return;

        e.preventDefault();
        e.currentTarget.classList.remove('bg-indigo-50', 'bg-opacity-30');

        const type = e.dataTransfer.getData('nodeType') as BlockEnum;
        if (type) {
          const flashElement = document.createElement('div');
          flashElement.style.position = 'absolute';
          flashElement.style.left = `${e.clientX - 20}px`;
          flashElement.style.top = `${e.clientY - 20}px`;
          flashElement.style.width = '40px';
          flashElement.style.height = '40px';
          flashElement.style.borderRadius = '50%';
          flashElement.style.backgroundColor = '#6366f1';
          flashElement.style.opacity = '0.5';
          flashElement.style.transition = 'all 0.3s ease-out';
          document.body.appendChild(flashElement);

          setTimeout(() => {
            flashElement.style.transform = 'scale(2)';
            flashElement.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(flashElement);
            }, 300);
          }, 10);

          handleNodeDrop(type, { x: e.clientX, y: e.clientY });
        }
      }}
    >
      <ReactFlow {...reactFlowProps}>
        <Background gap={[14, 14]} size={2} color="#9CA3AF" />
      </ReactFlow>
    </div>
  );
});
WorkflowInternal.displayName = 'WorkflowInternal';

export default memo(WorkflowInternal);
