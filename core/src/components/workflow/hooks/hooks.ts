import produce from 'immer';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import {
  ITERATION_CHILDREN_Z_INDEX,
  NODE_WIDTH_X_OFFSET,
  NODES_EXTRA_DATA,
  NODES_INITIAL_DATA,
  X_OFFSET,
  Y_OFFSET,
} from '@/app/workflows/[id]/const';
import { setLocalStorageItem, useStore } from '../store';
import {
  Connection,
  Edge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  NodeDragHandler,
  NodeMouseHandler,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
} from 'reactflow';
import type {
  AllNodeTypes,
  Node,
} from '@/app/workflows/[id]/_components/nodes/types';
import { useNodeIterationInteractions } from '@/app/workflows/[id]/_components/nodes/hooks';
import {
  generateNewNode,
  genNewNodeTitleFromOld,
  getNodesConnectedSourceOrTargetHandleIdsMap,
  getTopLeftNodePosition,
  sortNodes,
} from '../utils';
import { uniqBy } from 'lodash-es';
import { WorkflowContext } from '../context';
import {
  OnNodeAdd,
  ToolDefaultValue,
  WorkflowRunningStatus,
} from '@/app/workflows/[id]/types';
import { v4 } from 'uuid';
import {
  NodeInputTypes,
  NodeOutputTypes,
} from '@/app/workflows/[id]/_components/nodes/const';

export const useNodesExtraData = () => {
  return useMemo(
    () =>
      produce(NODES_EXTRA_DATA, (draft) => {
        Object.keys(draft).forEach((key) => {
          draft[key as BlockEnum].about = key;
          draft[key as BlockEnum].availablePrevNodes =
            draft[key as BlockEnum].getAvailablePrevNodes();
          draft[key as BlockEnum].availableNextNodes =
            draft[key as BlockEnum].getAvailableNextNodes();
        });
      }),
    []
  );
};

export const useNodesReadOnly = () => {
  const workflowStore = useContext(WorkflowContext)!;
  const workflowRunningData = useStore((s) => s.workflowRunningData);
  const historyWorkflowData = useStore((s) => s.historyWorkflowData);
  const isRestoring = useStore((s) => s.isRestoring);

  const getNodesReadOnly = useCallback(() => {
    const { workflowRunningData, historyWorkflowData, isRestoring } =
      workflowStore.getState();

    return (
      workflowRunningData?.result.status === WorkflowRunningStatus.Running ||
      historyWorkflowData ||
      isRestoring
    );
  }, [workflowStore]);

  return {
    nodesReadOnly: !!(
      workflowRunningData?.result.status === WorkflowRunningStatus.Running ||
      historyWorkflowData ||
      isRestoring
    ),
    getNodesReadOnly,
  };
};

export const usePanelInteractions = () => {
  const workflowStore = useContext(WorkflowContext)!;

  const handlePaneContextMenu = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault();
      const container = document.querySelector('#workflow-container');
      const { x, y } = container!.getBoundingClientRect();
      workflowStore.setState({
        panelMenu: {
          top: e.clientY - y,
          left: e.clientX - x,
        },
      });
    },
    [workflowStore]
  );

  const handlePaneContextmenuCancel = useCallback(() => {
    workflowStore.setState({
      panelMenu: undefined,
    });
  }, [workflowStore]);

  const handleNodeContextmenuCancel = useCallback(() => {
    workflowStore.setState({
      nodeMenu: undefined,
    });
  }, [workflowStore]);

  return {
    handlePaneContextMenu,
    handlePaneContextmenuCancel,
    handleNodeContextmenuCancel,
  };
};

export const useWorkflow = () => {
  const store = useStoreApi();
  const reactflow = useReactFlow();
  const workflowStore = useContext(WorkflowContext)!;
  const nodesExtraData = useNodesExtraData();

  const setPanelWidth = useCallback(
    (width: number) => {
      setLocalStorageItem('workflow-node-panel-width', `${width}`);
      workflowStore.setState({ panelWidth: width });
    },
    [workflowStore]
  );

  const handleLayout = () => {
    workflowStore.setState({ nodeAnimation: true });
    const { getNodes, edges, setNodes } = store.getState();
    const { setViewport } = reactflow;
    const nodes = getNodes();
    const newNodes = sortNodes(nodes, edges);
    setNodes(newNodes);
    setViewport({
      x: 0,
      y: 0,
      zoom: 1,
    });
  };

  const getAfterNodesInSameBranch = useCallback(
    (nodeId: string) => {
      const { getNodes, edges } = store.getState();
      const nodes = getNodes();
      const currentNode = nodes.find((node) => node.id === nodeId)!;

      if (!currentNode) return [];
      const list: Node[] = [currentNode];

      const traverse = (root: Node, callback: (node: Node) => void) => {
        if (root) {
          const outgoers = getOutgoers(root, nodes, edges);

          if (outgoers.length) {
            outgoers.forEach((node) => {
              callback(node);
              traverse(node, callback);
            });
          }
        }
      };
      traverse(currentNode, (node) => {
        list.push(node);
      });

      return uniqBy(list, 'id');
    },
    [store]
  );

  const getBeforeNodeById = useCallback(
    (nodeId: string) => {
      const { getNodes, edges } = store.getState();
      const nodes = getNodes();
      const node = nodes.find((node) => node.id === nodeId)!;

      return getIncomers(node, nodes, edges);
    },
    [store]
  );

  const getIterationNodeChildren = useCallback(
    (nodeId: string) => {
      const { getNodes } = store.getState();
      const nodes = getNodes();

      return nodes.filter((node) => node.parentId === nodeId);
    },
    [store]
  );

  const isValidConnection = useCallback(
    ({ source, target }: Connection) => {
      const { edges, getNodes } = store.getState();
      const nodes = getNodes();
      const sourceNode: Node = nodes.find((node) => node.id === source)!;
      const targetNode: Node = nodes.find((node) => node.id === target)!;

      if (sourceNode && targetNode) {
        const sourceNodeAvailableNextNodes =
          NodeOutputTypes[sourceNode.data.type];

        const targetNodeAvailablePrevNodes =
          NodeInputTypes[sourceNode.data.type];
      }

      const hasCycle = (node: Node, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      return !hasCycle(targetNode);
    },
    [store, nodesExtraData]
  );

  const getNode = useCallback(
    (nodeId?: string) => {
      const { getNodes } = store.getState();
      const nodes = getNodes();

      return nodes.find((node) => node.id === nodeId);
    },
    [store]
  );

  const enableShortcuts = useCallback(() => {
    const { setShortcutsDisabled } = workflowStore.getState();
    setShortcutsDisabled(false);
  }, [workflowStore]);

  const disableShortcuts = useCallback(() => {
    const { setShortcutsDisabled } = workflowStore.getState();
    setShortcutsDisabled(true);
  }, [workflowStore]);

  return {
    setPanelWidth,
    handleLayout,
    getAfterNodesInSameBranch,
    isValidConnection,
    getNode,
    getBeforeNodeById,
    getIterationNodeChildren,
    enableShortcuts,
    disableShortcuts,
  };
};

export const useNodesInteractions = () => {
  const store = useStoreApi();
  const workflowStore = useContext(WorkflowContext)!;
  const reactflow = useReactFlow();
  const { getAfterNodesInSameBranch } = useWorkflow();
  const { getNodesReadOnly } = useNodesReadOnly();
  const { handleNodeIterationChildDrag, handleNodeIterationChildrenCopy } =
    useNodeIterationInteractions();
  const dragNodeStartPosition = useRef({ x: 0, y: 0 } as {
    x: number;
    y: number;
  });

  const handleNodeDragStart = useCallback<NodeDragHandler>(
    (_, node) => {
      workflowStore.setState({ nodeAnimation: false });

      if (getNodesReadOnly()) return;

      if (node.data.isIterationStart) return;

      dragNodeStartPosition.current = {
        x: node.position.x,
        y: node.position.y,
      };
    },
    [workflowStore, getNodesReadOnly]
  );

  const handleNodeDrag = useCallback<NodeDragHandler>(
    (e, node: Node) => {
      if (getNodesReadOnly()) return;
      e.stopPropagation();

      const { getNodes, setNodes } = store.getState();
      const nodes = getNodes();
      const { restrictPosition } = handleNodeIterationChildDrag(node);

      const newNodes = produce(nodes, (draft) => {
        const currentNode = draft.find((n) => n.id === node.id)!;

        if (restrictPosition.x !== undefined)
          currentNode.position.x = restrictPosition.x;
        else currentNode.position.x = node.position.x;

        if (restrictPosition.y !== undefined)
          currentNode.position.y = restrictPosition.y;
        else currentNode.position.y = node.position.y;
      });

      setNodes(newNodes);
    },
    [store, getNodesReadOnly, handleNodeIterationChildDrag]
  );

  const handleNodeEnter = useCallback<NodeMouseHandler>(
    (_, node: Node) => {
      if (getNodesReadOnly()) return;

      const { getNodes, edges, setEdges, setNodes } = store.getState();
      const { connectingNodePayload } = workflowStore.getState();

      const newNodes = produce(getNodes(), (draft) => {
        const draftNode = draft.find((n) => n.id === node.id);
        if (draftNode) draftNode.data._hover = true;
      });
      setNodes(newNodes);

      if (connectingNodePayload?.nodeId === node.id) return;

      const connectedEdges = getConnectedEdges([node], edges);
      if (connectedEdges.length === 0) return;

      const newEdges = produce(edges, (draft) => {
        connectedEdges.forEach((edge) => {
          const currentEdge = draft.find((e) => e.id === edge.id);
          if (currentEdge) currentEdge.data.connectedNodeIsEntered = true;
        });
      });
      setEdges(newEdges);
    },
    [store, workflowStore, getNodesReadOnly]
  );

  const handleNodeLeave = useCallback<NodeMouseHandler>(() => {
    if (getNodesReadOnly()) return;

    const { setEnteringNodePayload } = workflowStore.getState();
    setEnteringNodePayload(undefined);

    const { getNodes, setNodes, edges, setEdges } = store.getState();
    const nodesWithEntering = getNodes().filter((node) => node.data._hover);

    if (nodesWithEntering.length > 0) {
      const newNodes = produce(getNodes(), (draft) => {
        nodesWithEntering.forEach((node) => {
          const draftNode = draft.find((n) => n.id === node.id);
          if (draftNode) draftNode.data._hover = false;
        });
      });
      setNodes(newNodes);
    }

    const edgesWithEntered = edges.filter(
      (edge) => edge.data?.connectedNodeIsEntered
    );

    if (edgesWithEntered.length > 0) {
      const newEdges = produce(edges, (draft) => {
        edgesWithEntered.forEach((edge) => {
          const draftEdge = draft.find((e) => e.id === edge.id);
          if (draftEdge && draftEdge.data)
            draftEdge.data.connectedNodeIsEntered = false;
        });
      });
      setEdges(newEdges);
    }
  }, [store, workflowStore, getNodesReadOnly]);

  const handleNodeSelect = useCallback(
    (nodeId: string, cancelSelection?: boolean) => {
      const { getNodes, setNodes, edges, setEdges } = store.getState();

      const nodes = getNodes();
      const selectedNode = nodes.find((node) => node.data.selected);

      if (!cancelSelection && selectedNode?.id === nodeId) return;

      const newNodes = produce(nodes, (draft) => {
        draft.forEach((node) => {
          if (node.id === nodeId) node.data.selected = !cancelSelection;
          else node.data.selected = false;
        });
      });
      setNodes(newNodes);

      const connectedEdges = getConnectedEdges(
        [{ id: nodeId } as Node],
        edges
      ).map((edge) => edge.id);
      const newEdges = produce(edges, (draft) => {
        draft.forEach((edge) => {
          if (connectedEdges.includes(edge.id)) {
            edge.data = {
              ...edge.data,
              _connectedNodeIsSelected: !cancelSelection,
            };
          } else {
            edge.data = {
              ...edge.data,
              _connectedNodeIsSelected: false,
            };
          }
        });
      });
      setEdges(newEdges);

      // If cancelling selection, also clear the selected node in the context
      if (cancelSelection) {
        try {
          const clearEvent = new CustomEvent('nodeClearSelection');
          document.dispatchEvent(clearEvent);
        } catch (error) {
          console.error('Error clearing selected node:', error);
        }
      }
    },
    [store]
  );

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      handleNodeSelect(node.id);

      try {
        const contexts = document.querySelectorAll(
          '[data-selected-node-context]'
        );
        const contextEvent = new CustomEvent('nodeSelected', {
          detail: {
            id: node.id,
            type: node.data.type,
            title: node.data.title,
            desc: node.data.desc,
            data: node.data,
          },
        });

        document.dispatchEvent(contextEvent);
      } catch (error) {
        console.error('Error updating shared context:', error);
      }
    },
    [handleNodeSelect]
  );

  const handleNodeConnect = useCallback<OnConnect>(
    ({ source, sourceHandle, target, targetHandle }) => {
      if (source === target) return;
      if (getNodesReadOnly()) return;

      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const nodes = getNodes();
      const targetNode = nodes.find((node) => node.id === target!);
      const sourceNode = nodes.find((node) => node.id === source!);

      if (targetNode?.parentId !== sourceNode?.parentId) return;

      if (targetNode?.data.isIterationStart) return;

      // if exist an edge with same source and target, return
      const existingEdge = edges.find(
        (edge) => edge.source === source && edge.target === target
      );
      if (existingEdge) return;

      const newEdge = {
        id: v4(),
        type: 'custom',
        source: source!,
        target: target!,
        sourceHandle,
        targetHandle,
        data: {
          sourceType: nodes.find((node) => node.id === source)!.data.type,
          targetType: nodes.find((node) => node.id === target)!.data.type,
          isInIteration: !!targetNode?.parentId,
          iteration_id: targetNode?.parentId,
        },
        zIndex: targetNode?.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
      };

      const nodesConnectedSourceOrTargetHandleIdsMap =
        getNodesConnectedSourceOrTargetHandleIdsMap(
          [{ type: 'add', edge: newEdge }],
          nodes
        );

      const newNodes = produce(nodes, (draft: Node[]) => {
        draft.forEach((node) => {
          if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
            node.data = {
              ...node.data,
              ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
            };
          }
        });
      });
      setNodes(newNodes);
      const newEdges = produce(edges, (draft) => {
        draft.push(newEdge);
        return draft;
      });
      setEdges(newEdges);
    },
    [store, getNodesReadOnly]
  );

  const handleNodeConnectStart = useCallback<OnConnectStart>(
    (_, { nodeId, handleType, handleId }) => {
      if (getNodesReadOnly()) return;

      if (nodeId && handleType) {
        const { setConnectingNodePayload } = workflowStore.getState();
        const { getNodes } = store.getState();
        const node = getNodes().find((n) => n.id === nodeId)!;

        if (!node.data.isIterationStart) {
          setConnectingNodePayload({
            nodeId,
            nodeType: node.data.type,
            handleType,
            handleId,
          });
        }
      }
    },
    [store, workflowStore, getNodesReadOnly]
  );

  const handleNodeConnectEnd = useCallback<OnConnectEnd>(
    (e: any) => {
      if (getNodesReadOnly()) return;

      const {
        connectingNodePayload,
        setConnectingNodePayload,
        enteringNodePayload,
        setEnteringNodePayload,
      } = workflowStore.getState();
      if (connectingNodePayload && enteringNodePayload) {
        const { setShowAssignVariablePopup, hoveringAssignVariableGroupId } =
          workflowStore.getState();
        const { screenToFlowPosition } = reactflow;
        const { getNodes, setNodes } = store.getState();
        const nodes = getNodes();
        const fromHandleType = connectingNodePayload.handleType;
        const fromHandleId = connectingNodePayload.handleId;
        const fromNode = nodes.find(
          (n) => n.id === connectingNodePayload.nodeId
        )!;
        const toNode = nodes.find((n) => n.id === enteringNodePayload.nodeId)!;
        const toParentNode = nodes.find((n) => n.id === toNode.parentId);

        if (fromNode.parentId !== toNode.parentId) return;

        const { x, y } = screenToFlowPosition({ x: e.x, y: e.y });

        if (fromHandleType === 'source') {
          const groupEnabled = toNode.data.advanced_settings?.group_enabled;
          const firstGroupId = toNode.data.advanced_settings?.groups[0].groupId;
          let handleId = 'target';

          if (groupEnabled) {
            if (hoveringAssignVariableGroupId)
              handleId = hoveringAssignVariableGroupId;
            else handleId = firstGroupId;
          }
          setNodes(nodes);
          setShowAssignVariablePopup({
            nodeId: fromNode.id,
            nodeData: fromNode.data,
            variableAssignerNodeId: toNode.id,
            variableAssignerNodeData: toNode.data as any,
            variableAssignerNodeHandleId: handleId,
            parentNode: toParentNode,
            x: x - toNode.positionAbsolute!.x,
            y: y - toNode.positionAbsolute!.y,
          });
          handleNodeConnect({
            source: fromNode.id,
            sourceHandle: fromHandleId,
            target: toNode.id,
            targetHandle: 'target',
          });
        }
      }
      setConnectingNodePayload(undefined);
      setEnteringNodePayload(undefined);
    },
    [store, handleNodeConnect, getNodesReadOnly, workflowStore, reactflow]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (getNodesReadOnly()) return;

      const { getNodes, setNodes, edges, setEdges } = store.getState();

      const nodes = getNodes();
      const currentNodeIndex = nodes.findIndex((node) => node.id === nodeId);
      const currentNode = nodes[currentNodeIndex];

      if (!currentNode) return;

      const connectedEdges = getConnectedEdges([{ id: nodeId } as Node], edges);
      const nodesConnectedSourceOrTargetHandleIdsMap =
        getNodesConnectedSourceOrTargetHandleIdsMap(
          connectedEdges.map((edge) => ({ type: 'remove', edge })),
          nodes
        );
      const newNodes = produce(nodes, (draft: Node[]) => {
        draft.forEach((node) => {
          if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
            node.data = {
              ...node.data,
              ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
            };
          }
        });
        draft.splice(currentNodeIndex, 1);
      });
      setNodes(newNodes);
      const newEdges = produce(edges, (draft) => {
        return draft.filter(
          (edge) =>
            !connectedEdges.find(
              (connectedEdge) => connectedEdge.id === edge.id
            )
        );
      });
      setEdges(newEdges);
    },
    [store, , getNodesReadOnly, workflowStore]
  );

  const handleNodeAdd = useCallback<OnNodeAdd>(
    (
      {
        nodeType,
        sourceHandle = 'source',
        targetHandle = 'target',
        toolDefaultValue,
      },
      { prevNodeId, prevNodeSourceHandle, nextNodeId, nextNodeTargetHandle }
    ) => {
      if (getNodesReadOnly()) return;

      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const nodes = getNodes();
      const nodesWithSameType = nodes.filter(
        (node) => node.data.type === nodeType
      );
      const newNode = generateNewNode({
        data: {
          ...NODES_INITIAL_DATA[nodeType],
          title:
            nodesWithSameType.length > 0
              ? `${nodeType} ${nodesWithSameType.length + 1}`
              : nodeType,
          ...(toolDefaultValue || {}),
          selected: true,
        } as any,
        position: {
          x: 0,
          y: 0,
        },
      });
      if (prevNodeId && !nextNodeId) {
        const prevNodeIndex = nodes.findIndex((node) => node.id === prevNodeId);
        const prevNode = nodes[prevNodeIndex];
        const outgoers = getOutgoers(prevNode, nodes, edges).sort(
          (a, b) => a.position.y - b.position.y
        );
        const lastOutgoer = outgoers[outgoers.length - 1];

        newNode.data.connectedTargetHandleIds = [targetHandle];
        newNode.data.connectedSourceHandleIds = [];
        newNode.position = {
          x: lastOutgoer
            ? lastOutgoer.position.x
            : prevNode.position.x + prevNode.width! + X_OFFSET,
          y: lastOutgoer
            ? lastOutgoer.position.y + lastOutgoer.height! + Y_OFFSET
            : prevNode.position.y,
        };
        newNode.parentId = prevNode.parentId;
        newNode.extent = prevNode.extent;
        if (prevNode.parentId) {
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }

        const newEdge: Edge = {
          id: `${prevNodeId}-${prevNodeSourceHandle}-${newNode.id}-${targetHandle}`,
          type: 'custom',
          source: prevNodeId,
          sourceHandle: prevNodeSourceHandle,
          target: newNode.id,
          targetHandle,
          data: {
            sourceType: prevNode.data.type,
            targetType: newNode.data.type,
            isInIteration: !!prevNode.parentId,
            iteration_id: prevNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: prevNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };
        const nodesConnectedSourceOrTargetHandleIdsMap =
          getNodesConnectedSourceOrTargetHandleIdsMap(
            [{ type: 'add', edge: newEdge }],
            nodes
          );
        const newNodes = produce(nodes, (draft: Node[]) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }

            if (prevNode.parentId === node.id)
              node.data._children?.push(newNode.id);
          });
          draft.push(newNode);
        });
        setNodes(newNodes);

        const newEdges = produce(edges, (draft) => {
          draft.forEach((item) => {
            item.data = {
              ...item.data,
              _connectedNodeIsSelected: false,
            };
          });
          draft.push(newEdge);
        });
        setEdges(newEdges);
      }
      if (!prevNodeId && nextNodeId) {
        const nextNodeIndex = nodes.findIndex((node) => node.id === nextNodeId);
        const nextNode = nodes[nextNodeIndex]!;

        if (nextNode.parentId) {
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }

        const newEdge = {
          id: v4(),
          type: 'custom',
          source: newNode.id,
          sourceHandle,
          target: nextNodeId,
          targetHandle: nextNodeTargetHandle,
          data: {
            sourceType: newNode.data.type,
            targetType: nextNode.data.type,
            isInIteration: !!nextNode.parentId,
            iteration_id: nextNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: nextNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };

        let nodesConnectedSourceOrTargetHandleIdsMap: Record<string, any>;
        if (newEdge) {
          nodesConnectedSourceOrTargetHandleIdsMap =
            getNodesConnectedSourceOrTargetHandleIdsMap(
              [{ type: 'add', edge: newEdge }],
              nodes
            );
        }

        const afterNodesInSameBranch = getAfterNodesInSameBranch(nextNodeId!);
        const afterNodesInSameBranchIds = afterNodesInSameBranch.map(
          (node) => node.id
        );
        const newNodes = produce(nodes, (draft) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (afterNodesInSameBranchIds.includes(node.id))
              node.position.x += NODE_WIDTH_X_OFFSET;

            if (nodesConnectedSourceOrTargetHandleIdsMap?.[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }

            if (node.id === nextNodeId && node.data.isIterationStart)
              node.data.isIterationStart = false;
          });
          draft.push(newNode);
        });
        setNodes(newNodes);
        if (newEdge) {
          const newEdges = produce(edges, (draft) => {
            draft.forEach((item) => {
              item.data = {
                ...item.data,
                _connectedNodeIsSelected: false,
              };
            });
            draft.push(newEdge);
          });
          setEdges(newEdges);
        }
      }
      if (prevNodeId && nextNodeId) {
        const prevNode = nodes.find((node) => node.id === prevNodeId)!;
        const nextNode = nodes.find((node) => node.id === nextNodeId)!;

        newNode.data.connectedTargetHandleIds = [targetHandle];
        newNode.data.connectedSourceHandleIds = [sourceHandle];
        newNode.position = {
          x: nextNode.position.x,
          y: nextNode.position.y,
        };
        newNode.parentId = prevNode.parentId;
        newNode.extent = prevNode.extent;
        if (prevNode.parentId) {
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }

        const currentEdgeIndex = edges.findIndex(
          (edge) => edge.source === prevNodeId && edge.target === nextNodeId
        );
        const newPrevEdge = {
          id: `${prevNodeId}-${prevNodeSourceHandle}-${newNode.id}-${targetHandle}`,
          type: 'custom',
          source: prevNodeId,
          sourceHandle: prevNodeSourceHandle,
          target: newNode.id,
          targetHandle,
          data: {
            sourceType: prevNode.data.type,
            targetType: newNode.data.type,
            isInIteration: !!prevNode.parentId,
            iteration_id: prevNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: prevNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };
        let newNextEdge: Edge | null = null;

        const nodesConnectedSourceOrTargetHandleIdsMap =
          getNodesConnectedSourceOrTargetHandleIdsMap(
            [
              { type: 'remove', edge: edges[currentEdgeIndex] },
              { type: 'add', edge: newPrevEdge },
              ...(newNextEdge ? [{ type: 'add', edge: newNextEdge }] : []),
            ],
            [...nodes, newNode]
          );

        const afterNodesInSameBranch = getAfterNodesInSameBranch(nextNodeId!);
        const afterNodesInSameBranchIds = afterNodesInSameBranch.map(
          (node) => node.id
        );
        const newNodes = produce(nodes, (draft) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }
            if (afterNodesInSameBranchIds.includes(node.id))
              node.position.x += NODE_WIDTH_X_OFFSET;
          });
          draft.push(newNode);
        });
        setNodes(newNodes);

        const newEdges = produce(edges, (draft) => {
          draft.splice(currentEdgeIndex, 1);
          draft.forEach((item) => {
            item.data = {
              ...item.data,
              _connectedNodeIsSelected: false,
            };
          });
          draft.push(newPrevEdge);

          if (newNextEdge) draft.push(newNextEdge);
        });
        setEdges(newEdges);
      }
    },
    [store, workflowStore, getAfterNodesInSameBranch, getNodesReadOnly]
  );

  const handleNodeChange = useCallback(
    (
      currentNodeId: string,
      nodeType: BlockEnum,
      sourceHandle: string,
      toolDefaultValue?: ToolDefaultValue
    ) => {
      if (getNodesReadOnly()) return;

      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const nodes = getNodes();
      const currentNode = nodes.find((node) => node.id === currentNodeId)!;
      const connectedEdges = getConnectedEdges([currentNode], edges);
      const nodesWithSameType = nodes.filter(
        (node) => node.data.type === nodeType
      );
      const newCurrentNode = generateNewNode({
        data: {
          ...NODES_INITIAL_DATA[nodeType],
          title:
            nodesWithSameType.length > 0
              ? `${nodeType} ${nodesWithSameType.length + 1}`
              : `${nodeType}`,
          ...(toolDefaultValue || {}),
          connectedSourceHandleIds: [],
          connectedTargetHandleIds: [],
          selected: currentNode.data.selected,
          iteration_id: currentNode.data.iteration_id,
        } as any,
        position: {
          x: currentNode.position.x,
          y: currentNode.position.y,
        },
        parentId: currentNode.parentId,
        extent: currentNode.extent,
        zIndex: currentNode.zIndex,
      });
      const nodesConnectedSourceOrTargetHandleIdsMap =
        getNodesConnectedSourceOrTargetHandleIdsMap(
          [...connectedEdges.map((edge) => ({ type: 'remove', edge }))],
          nodes
        );
      const newNodes = produce(nodes, (draft) => {
        draft.forEach((node) => {
          node.data.selected = false;

          if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
            node.data = {
              ...node.data,
              ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
            };
          }
          if (
            node.id === currentNode.parentId &&
            currentNode.data.isIterationStart
          ) {
            node.data._children = [
              newCurrentNode.id,
              ...(node.data._children || []),
            ].filter((child) => child !== currentNodeId);
            node.data.start_node_id = newCurrentNode.id;
            node.data.startNodeType = newCurrentNode.data.type;
          }
        });
        const index = draft.findIndex((node) => node.id === currentNodeId);

        draft.splice(index, 1, newCurrentNode);
      });
      setNodes(newNodes);
      const newEdges = produce(edges, (draft) => {
        const filtered = draft.filter(
          (edge) =>
            !connectedEdges.find(
              (connectedEdge) => connectedEdge.id === edge.id
            )
        );

        return filtered;
      });
      setEdges(newEdges);
    },
    [store, , getNodesReadOnly]
  );

  const handleNodeCancelRunningStatus = useCallback(() => {
    const { getNodes, setNodes } = store.getState();

    const nodes = getNodes();
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data._runningStatus = undefined;
      });
    });
    setNodes(newNodes);
  }, [store]);

  const handleNodesCancelSelected = useCallback(() => {
    const { getNodes, setNodes } = store.getState();

    const nodes = getNodes();
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data.selected = false;
      });
    });
    setNodes(newNodes);
  }, [store]);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // event.preventDefault();
      const container = document.querySelector('#workflow-container');
      const { x, y } = container!.getBoundingClientRect();
      workflowStore.setState({
        nodeMenu: {
          top: event.clientY - y,
          left: event.clientX - x,
          nodeId: node.id,
        },
      });
      handleNodeSelect(node.id);
    },
    [workflowStore, handleNodeSelect]
  );

  const handleNodesCopy = useCallback(() => {
    if (getNodesReadOnly()) return;

    const { setClipboardElements, shortcutsDisabled, showFeaturesPanel } =
      workflowStore.getState();

    if (shortcutsDisabled || showFeaturesPanel) return;

    const { getNodes } = store.getState();

    const nodes = getNodes();
    const bundledNodes = nodes.filter(
      (node) => node.data._isBundled && !node.data.isInIteration
    );

    if (bundledNodes.length) {
      setClipboardElements(bundledNodes);
      return;
    }

    const selectedNode = nodes.find((node) => node.data.selected);

    if (selectedNode) setClipboardElements([selectedNode]);
  }, [getNodesReadOnly, store, workflowStore]);

  const handleNodesPaste = useCallback(() => {
    if (getNodesReadOnly()) return;

    const {
      clipboardElements,
      shortcutsDisabled,
      showFeaturesPanel,
      mousePosition,
    } = workflowStore.getState();

    if (shortcutsDisabled || showFeaturesPanel) return;

    const { getNodes, setNodes } = store.getState();

    const nodesToPaste: Node[] = [];
    const nodes = getNodes();

    if (clipboardElements.length) {
      const { x, y } = getTopLeftNodePosition(clipboardElements);
      const { screenToFlowPosition } = reactflow;
      const currentPosition = screenToFlowPosition({
        x: mousePosition.pageX,
        y: mousePosition.pageY,
      });
      const offsetX = currentPosition.x - x;
      const offsetY = currentPosition.y - y;
      clipboardElements.forEach((nodeToPaste, index) => {
        const nodeType = nodeToPaste.data.type;

        const newNode = generateNewNode({
          data: {
            ...NODES_INITIAL_DATA[nodeType],
            ...nodeToPaste.data,
            selected: false,
            _isBundled: false,
            connectedSourceHandleIds: [],
            connectedTargetHandleIds: [],
            title: genNewNodeTitleFromOld(nodeToPaste.data.title),
          },
          position: {
            x: nodeToPaste.position.x + offsetX,
            y: nodeToPaste.position.y + offsetY,
          },
          extent: nodeToPaste.extent,
          zIndex: nodeToPaste.zIndex,
        });
        newNode.id = newNode.id + index;

        let newChildren: Node[] = [];

        nodesToPaste.push(newNode);

        if (newChildren.length) nodesToPaste.push(...newChildren);
      });

      setNodes([...nodes, ...nodesToPaste]);
    }
  }, [
    getNodesReadOnly,
    store,
    workflowStore,
    ,
    reactflow,
    handleNodeIterationChildrenCopy,
  ]);

  const handleNodesDuplicate = useCallback(() => {
    if (getNodesReadOnly()) return;

    handleNodesCopy();
    handleNodesPaste();
  }, [getNodesReadOnly, handleNodesCopy, handleNodesPaste]);

  const handleNodesDelete = useCallback(() => {
    if (getNodesReadOnly()) return;

    const { shortcutsDisabled, showFeaturesPanel } = workflowStore.getState();

    if (shortcutsDisabled || showFeaturesPanel) return;

    const { getNodes, edges } = store.getState();

    const nodes = getNodes();
    const bundledNodes = nodes.filter((node) => node.data._isBundled);

    if (bundledNodes.length) {
      bundledNodes.forEach((node) => handleNodeDelete(node.id));

      return;
    }

    const edgeSelected = edges.some((edge) => edge.selected);
    if (edgeSelected) return;

    const selectedNode = nodes.find((node) => node.data.selected);

    if (selectedNode) handleNodeDelete(selectedNode.id);
  }, [store, workflowStore, getNodesReadOnly, handleNodeDelete]);

  return {
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeEnter,
    handleNodeLeave,
    handleNodeSelect,
    handleNodeClick,
    handleNodeConnect,
    handleNodeConnectStart,
    handleNodeConnectEnd,
    handleNodeDelete,
    handleNodeChange,
    handleNodeAdd,
    handleNodeCancelRunningStatus,
    handleNodesCancelSelected,
    handleNodeContextMenu,
    handleNodesCopy,
    handleNodesPaste,
    handleNodesDuplicate,
    handleNodesDelete,
  };
};

export const useAvailableBlocks = (nodeType?: BlockEnum) => {
  const nodesExtraData = useNodesExtraData();
  const availablePrevBlocks = useMemo(() => {
    if (!nodeType) return [];
    return nodesExtraData[nodeType].availablePrevNodes || [];
  }, [nodeType, nodesExtraData]);

  const availableNextBlocks = useMemo(() => {
    if (!nodeType) return [];
    return nodesExtraData[nodeType].availableNextNodes || [];
  }, [nodeType, nodesExtraData]);

  return useMemo(() => {
    return {
      availablePrevBlocks: availablePrevBlocks,
      availableNextBlocks: availableNextBlocks,
    };
  }, [availablePrevBlocks, availableNextBlocks]);
};
