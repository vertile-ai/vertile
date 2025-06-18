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
} from '@/app/workflows/[id]/_components/workflow-main/const';
import {
  setLocalStorageItem,
  useStore,
} from '@/app/workflows/[id]/_components/workflow-main/store';
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
import type { Node } from '@/app/workflows/[id]/_components/nodes/types';
import { useNodeIterationInteractions } from '@/app/workflows/[id]/_components/nodes/hooks';
import {
  generateNewNode,
  genNewNodeTitleFromOld,
  getNodesConnectedSourceOrTargetHandleIdsMap,
  getTopLeftNodePosition,
  sortNodes,
} from '@/app/workflows/[id]/_components/workflow-internal/utils';
import { uniqBy } from 'lodash-es';
import { WorkflowContext } from '@/app/workflows/[id]/_components/workflow-internal/context';
import {
  OnNodeAdd,
  ToolDefaultValue,
  WorkflowRunningStatus,
} from '@/app/workflows/[id]/types';
import { v4 } from 'uuid';

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

  const handleLayout = useCallback(() => {
    workflowStore.setState({ nodeAnimation: true });
    const { getNodes, edges, setNodes } = store.getState();
    const { setViewport, getViewport } = reactflow;
    const nodes = getNodes();
    const currentViewport = getViewport();

    const newNodes = sortNodes(nodes, edges);
    setNodes(newNodes);

    workflowStore.setState({ hasChanges: true });
    setViewport({
      x: currentViewport.x,
      y: currentViewport.y,
      zoom: 1,
    });
  }, [store, reactflow, workflowStore]);

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
      const targetNode: Node = nodes.find((node) => node.id === target)!;

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

export { useNodesInteractions } from './use-node-interactions';
