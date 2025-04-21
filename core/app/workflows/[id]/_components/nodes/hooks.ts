import { useStoreApi } from 'reactflow';
import { CommonNodeType } from '@/app/workflows/[id]/_components/nodes/types';
import { useCallback } from 'react';
import produce from 'immer';
import { useNodesReadOnly } from '@/src/components/workflow/hooks/hooks';

import type {
  BlockEnum,
  Node,
} from '@/app/workflows/[id]/_components/nodes/types';
import {
  ITERATION_PADDING,
  NODES_INITIAL_DATA,
} from '@/app/workflows/[id]/const';
import { generateNewNode } from '@/src/components/workflow/utils';

export const useNodeIterationInteractions = () => {
  const store = useStoreApi();

  const handleNodeIterationRerender = useCallback(
    (nodeId: string) => {
      const { getNodes, setNodes } = store.getState();

      const nodes = getNodes();
      const currentNode = nodes.find((n) => n.id === nodeId)!;
      const childrenNodes = nodes.filter((n) => n.parentId === nodeId);
      let rightNode: Node;
      let bottomNode: Node;

      childrenNodes.forEach((n) => {
        if (rightNode) {
          if (n.position.x + n.width! > rightNode.position.x + rightNode.width!)
            rightNode = n;
        } else {
          rightNode = n;
        }
        if (bottomNode) {
          if (
            n.position.y + n.height! >
            bottomNode.position.y + bottomNode.height!
          )
            bottomNode = n;
        } else {
          bottomNode = n;
        }
      });

      const widthShouldExtend =
        rightNode! &&
        currentNode.width! < rightNode.position.x + rightNode.width!;
      const heightShouldExtend =
        bottomNode! &&
        currentNode.height! < bottomNode.position.y + bottomNode.height!;

      if (widthShouldExtend || heightShouldExtend) {
        const newNodes = produce(nodes, (draft) => {
          draft.forEach((n) => {
            if (n.id === nodeId) {
              if (widthShouldExtend) {
                n.data.width =
                  rightNode.position.x +
                  rightNode.width! +
                  ITERATION_PADDING.right;
                n.width =
                  rightNode.position.x +
                  rightNode.width! +
                  ITERATION_PADDING.right;
              }
              if (heightShouldExtend) {
                n.data.height =
                  bottomNode.position.y +
                  bottomNode.height! +
                  ITERATION_PADDING.bottom;
                n.height =
                  bottomNode.position.y +
                  bottomNode.height! +
                  ITERATION_PADDING.bottom;
              }
            }
          });
        });

        setNodes(newNodes);
      }
    },
    [store]
  );

  const handleNodeIterationChildDrag = useCallback(
    (node: Node) => {
      const { getNodes } = store.getState();
      const nodes = getNodes();

      const restrictPosition: { x?: number; y?: number } = {
        x: undefined,
        y: undefined,
      };

      return {
        restrictPosition,
      };
    },
    [store]
  );

  const handleNodeIterationChildSizeChange = useCallback(
    (nodeId: string) => {
      const { getNodes } = store.getState();
      const nodes = getNodes();
      const currentNode = nodes.find((n) => n.id === nodeId)!;
      const parentId = currentNode.parentId;

      if (parentId) handleNodeIterationRerender(parentId);
    },
    [store, handleNodeIterationRerender]
  );

  const handleNodeIterationChildrenCopy = useCallback(
    (nodeId: string, newNodeId: string) => {
      const { getNodes } = store.getState();
      const nodes = getNodes();
      const childrenNodes = nodes.filter((n) => n.parentId === nodeId);

      return childrenNodes.map((child, index) => {
        const childNodeType = child.data.type as BlockEnum;
        const nodesWithSameType = nodes.filter(
          (node) => node.data.type === childNodeType
        );
        const newNode = generateNewNode({
          data: {
            ...NODES_INITIAL_DATA[childNodeType],
            ...child.data,
            selected: false,
            _isBundled: false,
            connectedSourceHandleIds: [],
            connectedTargetHandleIds: [],
            title:
              nodesWithSameType.length > 0
                ? `${childNodeType} ${nodesWithSameType.length + 1}`
                : childNodeType,
          },
          position: child.position,
          parentId: newNodeId,
          extent: child.extent,
          zIndex: child.zIndex,
        });
        newNode.id = `${newNodeId}${newNode.id + index}`;
        return newNode;
      });
    },
    [store]
  );

  return {
    handleNodeIterationRerender,
    handleNodeIterationChildDrag,
    handleNodeIterationChildSizeChange,
    handleNodeIterationChildrenCopy,
  };
};

interface NodeDataUpdatePayload {
  id: string;
  data: Record<string, any>;
}

export const useNodeInfo = (nodeId: string) => {
  const store = useStoreApi();
  const { getNodes } = store.getState();
  const allNodes = getNodes();
  const node = allNodes.find((n) => n.id === nodeId);
  const parentNodeId = node?.parentId;
  const parentNode = allNodes.find((n) => n.id === parentNodeId);
  return {
    node,
    parentNode,
  };
};

export const useNodeDataUpdate = () => {
  const store = useStoreApi();
  const { getNodesReadOnly } = useNodesReadOnly();

  const handleNodeDataUpdate = useCallback(
    ({ id, data }: NodeDataUpdatePayload) => {
      const { getNodes, setNodes } = store.getState();
      const newNodes = produce(getNodes(), (draft) => {
        const currentNode = draft.find((node) => node.id === id)!;

        currentNode.data = { ...currentNode?.data, ...data };
      });
      setNodes(newNodes);
    },
    [store]
  );

  const handleNodeDataUpdateWithSyncDraft = useCallback(
    (payload: NodeDataUpdatePayload) => {
      if (getNodesReadOnly()) return;

      handleNodeDataUpdate(payload);
    },
    [handleNodeDataUpdate, getNodesReadOnly]
  );

  return {
    handleNodeDataUpdate,
    handleNodeDataUpdateWithSyncDraft,
  };
};
export const useNodeCrud = <NodeType extends CommonNodeType = CommonNodeType>(
  id: string,
  data: NodeType
) => {
  const { handleNodeDataUpdateWithSyncDraft } = useNodeDataUpdate();

  const setInputs = (newInputs: NodeType) => {
    handleNodeDataUpdateWithSyncDraft({
      id,
      data: newInputs,
    });
  };

  return {
    inputs: data,
    setInputs,
  };
};
