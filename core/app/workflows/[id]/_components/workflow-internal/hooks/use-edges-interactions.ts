import { useCallback, useRef } from 'react';
import produce from 'immer';
import type { EdgeMouseHandler, OnEdgesChange } from 'reactflow';
import { useStoreApi } from 'reactflow';
import type { Node } from '@/app/workflows/[id]/_components/nodes/types';
import { getNodesConnectedSourceOrTargetHandleIdsMap } from '@/app/workflows/[id]/_components/workflow-internal/utils';

export const useEdgesInteractions = () => {
  const store = useStoreApi();
  // Track current hovered edge to avoid unnecessary updates
  const hoveredEdgeRef = useRef<string | null>(null);

  const handleEdgeEnter = useCallback<EdgeMouseHandler>(
    (_, edge) => {
      // Skip if already hovering this edge
      if (hoveredEdgeRef.current === edge.id) return;

      const { edges, setEdges } = store.getState();

      // Only update the specific edge
      hoveredEdgeRef.current = edge.id;
      const newEdges = produce(edges, (draft) => {
        const currentEdge = draft.find((e) => e.id === edge.id);
        if (currentEdge) {
          currentEdge.data = {
            ...currentEdge.data,
            _hovering: true,
          };
        }
      });
      setEdges(newEdges);
    },
    [store]
  );

  const handleEdgeLeave = useCallback<EdgeMouseHandler>(
    (_, edge) => {
      // Clear hover state
      hoveredEdgeRef.current = null;

      const { edges, setEdges } = store.getState();

      // Skip update if edge doesn't exist or isn't hovering
      const currentEdge = edges.find((e) => e.id === edge.id);
      if (!currentEdge || !currentEdge.data?._hovering) return;

      // Only update the specific edge
      const newEdges = produce(edges, (draft) => {
        const edgeToUpdate = draft.find((e) => e.id === edge.id);
        if (edgeToUpdate) {
          edgeToUpdate.data = {
            ...edgeToUpdate.data,
            _hovering: false,
          };
        }
      });
      setEdges(newEdges);
    },
    [store]
  );

  const handleEdgeDeleteByDeleteBranch = useCallback(
    (nodeId: string, branchId: string) => {
      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const currentEdgeIndex = edges.findIndex(
        (edge) => edge.source === nodeId && edge.sourceHandle === branchId
      );

      if (currentEdgeIndex < 0) return;

      const currentEdge = edges[currentEdgeIndex];
      const newNodes = produce(getNodes(), (draft: Node[]) => {
        const sourceNode = draft.find((node) => node.id === currentEdge.source);
        const targetNode = draft.find((node) => node.id === currentEdge.target);

        if (sourceNode)
          sourceNode.data.connectedSourceHandleIds =
            sourceNode.data.connectedSourceHandleIds?.filter(
              (handleId) => handleId !== currentEdge.sourceHandle
            );

        if (targetNode)
          targetNode.data.connectedTargetHandleIds =
            targetNode.data.connectedTargetHandleIds?.filter(
              (handleId) => handleId !== currentEdge.targetHandle
            );
      });
      setNodes(newNodes);
      const newEdges = produce(edges, (draft) => {
        draft.splice(currentEdgeIndex, 1);
      });
      setEdges(newEdges);
    },
    [store]
  );

  const handleEdgeDelete = useCallback(() => {
    const { getNodes, setNodes, edges, setEdges } = store.getState();
    const currentEdgeIndex = edges.findIndex((edge) => edge.selected);

    if (currentEdgeIndex < 0) return;
    const currentEdge = edges[currentEdgeIndex];
    const nodes = getNodes();
    const nodesConnectedSourceOrTargetHandleIdsMap =
      getNodesConnectedSourceOrTargetHandleIdsMap(
        [{ type: 'remove', edge: currentEdge }],
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
      draft.splice(currentEdgeIndex, 1);
    });
    setEdges(newEdges);
  }, [store]);

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      const { edges, setEdges } = store.getState();

      const newEdges = produce(edges, (draft) => {
        changes.forEach((change) => {
          if (change.type === 'select')
            draft.find((edge) => edge.id === change.id)!.selected =
              change.selected;
        });
      });
      setEdges(newEdges);
    },
    [store]
  );

  const handleEdgeCancelRunningStatus = useCallback(() => {
    const { edges, setEdges } = store.getState();

    const newEdges = produce(edges, (draft) => {
      draft.forEach((edge) => {
        edge.data._runned = false;
      });
    });
    setEdges(newEdges);
  }, [store]);

  return {
    handleEdgeEnter,
    handleEdgeLeave,
    handleEdgeDeleteByDeleteBranch,
    handleEdgeDelete,
    handleEdgesChange,
    handleEdgeCancelRunningStatus,
  };
};
