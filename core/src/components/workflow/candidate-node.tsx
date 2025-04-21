import { memo, useContext } from 'react';
import produce from 'immer';
import { useReactFlow, useStoreApi, useViewport } from 'reactflow';
import { useEventListener } from 'ahooks';
import { useStore } from './store';
import CustomNode from './nodes';
import React from 'react';
import { WorkflowContext } from './context';

const CandidateNode = () => {
  const store = useStoreApi();
  const reactflow = useReactFlow();
  const workflowStore = useContext(WorkflowContext)!;
  const candidateNode = useStore((s) => s.candidateNode);
  const mousePosition = useStore((s) => s.mousePosition);
  const { zoom } = useViewport();

  useEventListener('click', (e) => {
    const { candidateNode, mousePosition } = workflowStore.getState();

    if (candidateNode) {
      e.preventDefault();
      const { getNodes, setNodes } = store.getState();
      const { screenToFlowPosition } = reactflow;
      const nodes = getNodes();
      const { x, y } = screenToFlowPosition({
        x: mousePosition.pageX,
        y: mousePosition.pageY,
      });
      const newNodes = produce(nodes, (draft) => {
        draft.push({
          ...candidateNode,
          data: {
            ...candidateNode.data,
            isCandidate: false,
          },
          position: {
            x,
            y,
          },
        });
      });
      setNodes(newNodes);
      workflowStore.setState({ candidateNode: undefined });
    }
  });

  useEventListener('contextmenu', (e) => {
    const { candidateNode } = workflowStore.getState();
    if (candidateNode) {
      e.preventDefault();
      workflowStore.setState({ candidateNode: undefined });
    }
  });

  if (!candidateNode) return null;

  return (
    <div
      className="absolute z-10"
      style={{
        left: mousePosition.elementX,
        top: mousePosition.elementY,
        transform: `scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      <CustomNode {...(candidateNode as any)} />
    </div>
  );
};

export default memo(CandidateNode);
