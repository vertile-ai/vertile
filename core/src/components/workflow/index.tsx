import React, { useContext, useState } from 'react';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import produce, { setAutoFreeze } from 'immer';
import { useEventListener, useKeyPress } from 'ahooks';
import ReactFlow, {
  Background,
  SelectionMode,
  ConnectionLineType,
  useOnViewportChange,
  useReactFlow,
  useStoreApi,
} from 'reactflow';
import type { Viewport } from 'reactflow';
import 'reactflow/dist/style.css';
import './style.css';
import { AllNodeTypes, BlockEnum, Edge, Node, CommonEdgeType } from './types';
import {
  useNodesInteractions,
  useNodesReadOnly,
  usePanelInteractions,
  useWorkflow,
} from './hooks/hooks';
import { useWorkflow as useWorkflowCrud } from './hooks/workflow.hooks';
import CustomNode from './nodes';
import Operator from './tools';
import CustomEdge from './custom-edge';
import CustomConnectionLine from './custom-connection-line';
import { useStore } from './store';
import { generateNewNode, getKeyboardKeyCodeBySystem } from './utils';
import { ITERATION_CHILDREN_Z_INDEX, NODES_INITIAL_DATA } from './constants';
import { useEdgesInteractions } from './hooks/use-edges-interactions';
import { useSelectionInteractions } from './hooks/use-selection-interactions';
import { NodeSelector } from './NodeSelector.component';
import { v4 } from 'uuid';
import { WorkflowClient } from '@/app/lib/common/workflow.types';
import { detectCycle } from '@/app/lib/graph';

// Define nodeTypes and edgeTypes outside the component to prevent recreating on every render
const nodeTypes: Record<'custom', React.FC> = {
  custom: CustomNode,
};

const edgeTypes: Record<'custom', React.FC> = {
  custom: CustomEdge,
};

interface WorkflowProps {
  viewport?: Viewport;
  workflowId?: string;
  initialData?: WorkflowClient;
}

const Workflow: FC<WorkflowProps> = memo(({ viewport, initialData }) => {
  const workflowContainerRef = useRef<HTMLDivElement>(null);

  const controlMode = useStore((s) => s.controlMode);
  const nodeAnimation = useStore((s) => s.nodeAnimation);
  const handleWorkflowChange = useStore((s) => s.handleWorkflowChange);
  const setMousePosition = useStore((s) => s.setMousePosition);
  const setLastSaved = useStore((s) => s.setLastSaved);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const { nodesReadOnly } = useNodesReadOnly();
  const store = useStoreApi();
  const reactflow = useReactFlow();

  const workflowId = useStore((s) => s.workflowId);

  const { updateWorkflow } = useWorkflowCrud();

  // Track if we need to send an update
  const shouldUpdateRef = useRef(false);

  // Get the handlers from hooks first before trying to patch them
  const {
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
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
    handleNodesDelete,
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
  const { isValidConnection, handleLayout } = useWorkflow();

  // Memoized handler to save data
  const saveEdgesToBackend = useCallback(() => {
    const { getNodes } = store.getState();
    const currentNodes = getNodes();
    const { edges: currentEdges } = store.getState();
    const { getViewport } = reactflow;
    const currentViewport = getViewport();

    const workflowData = {
      ...initialData,
      zoom: currentViewport.zoom,
      nodes: currentNodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        positionX: node.position.x,
        positionY: node.position.y,
        data: node.data,
      })),
      edges: currentEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        data: edge.data,
      })),
    };

    try {
      updateWorkflow(workflowId, workflowData);
      setLastSaved(Date.now());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving workflow:', error);
      setSaveStatus('error');
    }
  }, [initialData, reactflow, store, updateWorkflow, workflowId]);

  // Handle delayed update to backend
  useEffect(() => {
    if (!initialData) return;

    // Check for updates every 2 seconds if changes detected
    const interval = setInterval(() => {
      if (shouldUpdateRef.current) {
        saveEdgesToBackend();
        shouldUpdateRef.current = false;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [initialData, saveEdgesToBackend]);

  // Create memoized versions of handlers to prevent rerenders
  const memoizedHandleNodeDragStop = useMemo(() => {
    return (event: any, node: any, nodes: any) => {
      if (handleNodeDragStop) {
        handleNodeDragStop(event, node, nodes);
      }
      shouldUpdateRef.current = true;
    };
  }, [handleNodeDragStop]);

  const memoizedHandleNodeConnect = useMemo(() => {
    return (connection: any) => {
      if (handleNodeConnect) {
        handleNodeConnect(connection);
      }
      shouldUpdateRef.current = true;
    };
  }, [handleNodeConnect]);

  const memoizedHandleEdgesChange = useMemo(() => {
    return (changes: any) => {
      if (handleEdgesChange) {
        handleEdgesChange(changes);
      }
      shouldUpdateRef.current = true;
    };
  }, [handleEdgesChange]);

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

  // Handle DnD for node creation
  const handleNodeDrop = useCallback(
    (type: BlockEnum, position: { x: number; y: number }) => {
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

      shouldUpdateRef.current = true;
      const { setNodes } = store.getState();
      setNodes(newNodes);
    },
    [reactflow, store]
  );

  const { setNodes, getNodes, setEdges } = store.getState();
  const edges = store.getState().edges;
  const { setViewport } = reactflow;

  const [initialViewport, setInitialViewport] = useState<Viewport | undefined>(
    viewport
  );

  const firstTimeLoadingRef = useRef(true);

  // Load initial data when available
  useEffect(() => {
    if (
      initialData?.nodes &&
      initialData?.edges &&
      firstTimeLoadingRef.current
    ) {
      try {
        console.log('Loading initial data:', initialData);

        // Convert backend data to ReactFlow format
        const nodes = initialData.nodes.map((node) => ({
          id: node.id,
          type: 'custom',
          position: { x: node.positionX, y: node.positionY },
          data: { ...node.data, type: node.type },
        }));

        // Make sure to map the correct properties from backend to ReactFlow edge format
        const edges = initialData.edges.map((edge) => {
          const newEdge = {
            ...edge,
            data: { ...edge.data },
          };
          return newEdge;
        });

        setNodes(nodes);
        // TODO: fix type
        setEdges(edges as any);

        if (initialData.zoom) {
          const newViewport = {
            x: 0,
            y: 0,
            zoom: initialData.zoom,
          };
          setInitialViewport(newViewport);
          setViewport(newViewport);
        }
      } catch (err) {
        console.error('Error loading workflow data:', err);
        console.error(
          'Error details:',
          err instanceof Error ? err.message : 'Unknown error'
        );
      }
      firstTimeLoadingRef.current = false;
    }
  }, [initialData]);

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

  useOnViewportChange({
    onEnd: () => {},
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

  const handleRunAll = () => {
    const jobId = v4();
  };

  const nodes = getNodes();

  // Memoize ReactFlow props to prevent unnecessary rerenders
  const reactFlowProps = useMemo(
    () => ({
      nodeTypes,
      edgeTypes,
      nodes,
      edges,
      onNodeDragStart: handleNodeDragStart,
      onNodeDrag: handleNodeDrag,
      onNodeDragStop: memoizedHandleNodeDragStop,
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
      defaultViewport: initialViewport,
      multiSelectionKeyCode: null,
      deleteKeyCode: null,
      nodesDraggable: !nodesReadOnly,
      nodesConnectable: !nodesReadOnly,
      nodesFocusable: !nodesReadOnly,
      edgesFocusable: !nodesReadOnly,
      panOnDrag: controlMode === 'hand',
      zoomOnPinch: true,
      zoomOnScroll: true,
      zoomOnDoubleClick: true,
      isValidConnection: isValidConnection,
      selectionKeyCode: null,
      selectionMode: SelectionMode.Partial,
      selectionOnDrag: controlMode === 'pointer',
      minZoom: 0.25,
      fitView: false,
      fitViewOptions: { padding: 0.2 },
      proOptions: { hideAttribution: true },
    }),
    [
      handleNodeDragStart,
      handleNodeDrag,
      memoizedHandleNodeDragStop,
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
      initialViewport,
      nodesReadOnly,
      controlMode,
      isValidConnection,
    ]
  );

  return (
    <div
      id="workflow-container"
      className={`
        relative w-full h-full
        ${nodeAnimation && 'workflow-node-animation'}
      `}
      ref={workflowContainerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('bg-indigo-50', 'bg-opacity-30');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('bg-indigo-50', 'bg-opacity-30');
      }}
      onDrop={(e) => {
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
      <div className="z-[100] absolute top-[36px] left-2">
        <NodeSelector />
      </div>
      <Operator />
      <ReactFlow {...reactFlowProps}>
        <Background gap={[14, 14]} size={2} color="#9CA3AF" />
      </ReactFlow>
    </div>
  );
});
Workflow.displayName = 'Workflow';

export default memo(Workflow);
