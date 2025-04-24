import { useCallback, useEffect } from 'react';
import { useStoreApi } from 'reactflow';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { produce } from 'immer';

export function useNodeExecution() {
  const store = useStoreApi();
  const nodeExecutionStatuses = useStore((s) => s.nodeExecutionStatuses);

  // Update node visuals based on execution status
  useEffect(() => {
    if (
      !nodeExecutionStatuses ||
      Object.keys(nodeExecutionStatuses).length === 0
    ) {
      return;
    }

    const { getNodes, setNodes } = store.getState();
    const nodes = getNodes();

    // Update node visuals based on execution status
    const updatedNodes = produce(nodes, (draft) => {
      for (const node of draft) {
        const status = nodeExecutionStatuses[node.id];
        if (status) {
          // Set the _runningStatus property which is used by BaseNode component
          node.data = {
            ...node.data,
            _runningStatus: status,
          };
        }
      }
    });

    setNodes(updatedNodes);
  }, [nodeExecutionStatuses, store]);

  return {
    nodeExecutionStatuses,
  };
}
