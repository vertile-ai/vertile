import { useStoreApi } from 'reactflow';
import { CommonNodeType } from '../types';
import { useCallback } from 'react';
import produce from 'immer';
import { useNodesReadOnly } from './hooks';

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
