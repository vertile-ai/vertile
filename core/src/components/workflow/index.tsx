import React, { useContext, useState } from 'react';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import produce, { setAutoFreeze } from 'immer';
import { useEventListener, useKeyPress } from 'ahooks';
import ReactFlow, {
  Background,
  ReactFlowProvider,
  SelectionMode,
  ConnectionLineType,
  useOnViewportChange,
  useReactFlow,
  useStoreApi,
} from 'reactflow';
import type { Viewport } from 'reactflow';
import 'reactflow/dist/style.css';
import './style.css';
import { AllNodeTypes, BlockEnum, Edge, Node, CustomNodeType } from './types';
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
import {
  ITERATION_CHILDREN_Z_INDEX,
  NODES_INITIAL_DATA,
  WORKFLOW_DATA_UPDATE,
} from './constants';
import { useEventEmitterContextContext } from '@/src/contexts/EventEmitter';
import { useEdgesInteractions } from './hooks/use-edges-interactions';
import { useSelectionInteractions } from './hooks/use-selection-interactions';
import { NodeSelector } from './NodeSelector.component';
import { v4 } from 'uuid';
import { WorkflowWithRelations } from '@/app/workflows/[id]/types';

// Define nodeTypes and edgeTypes outside the component to prevent recreating on every render
const nodeTypes: Record<CustomNodeType, React.FC> = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface WorkflowProps {
  nodes: Node<AllNodeTypes>[];
  edges: Edge[];
  viewport?: Viewport;
  workflowId?: string;
  initialData?: any;
}

const Workflow: FC<WorkflowProps> = memo(
  ({ nodes: originalNodes, edges: originalEdges, viewport, initialData }) => {
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

    // Handle delayed update to backend
    useEffect(() => {
      if (!initialData) return;

      // Function to send workflow data to parent
      const sendUpdate = () => {
        setSaveStatus('saving');
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
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
          })),
        };

        try {
          updateWorkflow(workflowId, workflowData);
          setLastSaved(Date.now());
          setSaveStatus('saved');
        } catch (error) {
          setSaveStatus('error');
        } finally {
          shouldUpdateRef.current = false;
        }
      };

      // Check for updates every 2 seconds if changes detected
      const interval = setInterval(() => {
        if (shouldUpdateRef.current) {
          sendUpdate();
        }
      }, 2000);

      return () => clearInterval(interval);
    }, [store, reactflow, initialData, handleWorkflowChange]);

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
        const nodesWithSameType = nodes.filter(
          (node) => node.data.type === type
        );

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
            data: newNode.data,
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
    const { setViewport } = reactflow;

    // Prepare nodes and edges based on initialData
    const [flowNodes, setFlowNodes] = useState<Node<AllNodeTypes>[]>([]);
    const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
    const [initialViewport, setInitialViewport] = useState<
      Viewport | undefined
    >(viewport);

    // Load initial data when available
    useEffect(() => {
      if (initialData?.nodes && initialData?.edges) {
        try {
          console.log('Loading initial data:', initialData);

          // Convert backend data to ReactFlow format
          const nodes = initialData.nodes.map((node) => ({
            id: node.id,
            type: 'custom',
            position: { x: node.positionX, y: node.positionY },
            data: { ...node.data, type: node.type },
          }));

          const edges = initialData.edges.map((edge) => ({
            id: edge.id || `${edge.sourceNodeId}-${edge.targetNodeId}`,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            type: 'custom',
          }));

          // Set local state for ReactFlow
          console.log('Setting nodes and edges:', {
            nodes,
            edges,
          });
          setFlowNodes(nodes);
          setFlowEdges(edges);

          // Also initialize the ReactFlow state store
          setNodes(nodes);
          setEdges(edges);

          // Set viewport if available
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
      }
    }, [initialData]);

    const { eventEmitter } = useEventEmitterContextContext();

    eventEmitter?.useSubscription((v: any) => {
      if (v.type === WORKFLOW_DATA_UPDATE) {
        setNodes(v.payload.nodes);
        setEdges(v.payload.edges);
        // Also update our local state for ReactFlow
        setFlowNodes(v.payload.nodes);
        setFlowEdges(v.payload.edges);
      }
    });

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
    useKeyPress(
      `${getKeyboardKeyCodeBySystem('ctrl')}.d`,
      handleNodesDuplicate,
      {
        exactMatch: true,
        useCapture: true,
      }
    );

    const handleRunAll = () => {
      const jobId = v4();
    };

    // Memoize ReactFlow props to prevent unnecessary rerenders
    const reactFlowProps = useMemo(
      () => ({
        nodeTypes,
        edgeTypes,
        nodes: flowNodes,
        edges: flowEdges,
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
        fitView: true,
        fitViewOptions: { padding: 0.2 },
        proOptions: { hideAttribution: true },
      }),
      [
        flowNodes,
        flowEdges,
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
        <button
          onClick={handleRunAll}
          className="absolute top-1 right-4 z-[100] bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none"
        >
          Run All
        </button>

        <div className="z-[100] absolute top-[36px] left-2">
          <NodeSelector />
        </div>
        <Operator />
        <ReactFlow {...reactFlowProps}>
          <Background gap={[14, 14]} size={2} color="#9CA3AF" />
        </ReactFlow>
      </div>
    );
  }
);
Workflow.displayName = 'Workflow';

interface WorkflowContainerProps {
  workflowId?: string;
  initialData?: WorkflowWithRelations;
}

const WorkflowContainer = ({
  workflowId,
  initialData,
}: WorkflowContainerProps) => {
  return (
    <Workflow
      nodes={[]}
      edges={[]}
      viewport={{ x: 0, y: 0, zoom: 1 }}
      workflowId={workflowId}
      initialData={initialData}
    />
  );
};

export const WorkflowReactFlowProvider = ReactFlowProvider;

export default memo(WorkflowContainer);
