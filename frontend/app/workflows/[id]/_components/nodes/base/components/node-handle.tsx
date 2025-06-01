import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Node } from '@/app/workflows/[id]/_components/nodes/types';
import { NodeInputTypes, NodeOutputTypes } from '../../const';

type NodeHandleProps = {
  handleId: string;
  handleClassName?: string;
  nodeSelectorClassName?: string;
} & Pick<Node, 'id' | 'data'>;

// Optimized target handle to prevent rerenders on hover
export const NodeTargetHandle = memo(
  ({ id, data, handleId, handleClassName }: NodeHandleProps) => {
    const connected = data.connectedTargetHandleIds?.includes(handleId);
    const isConnectable = !!NodeInputTypes[data.type].length;

    const handleClassName1 = useMemo(
      () => `
      !w-5 !h-5 z-[10] !bg-transparent !border-none !outline-none
      after:absolute after:right-2.5 after:top-1.5 after:h-2 after:w-0.5 after:bg-indigo-500
      hover:scale-125 transition-all flex items-center justify-center
      ${!data._hover && 'after:opacity-0'}
      ${handleClassName}
    `,
      [connected, handleClassName, data._hover]
    );

    return (
      <>
        <Handle
          id={handleId}
          type="target"
          position={Position.Left}
          className={handleClassName1}
          isConnectable={isConnectable}
        ></Handle>
      </>
    );
  }
);
NodeTargetHandle.displayName = 'NodeTargetHandle';

// Optimized source handle to prevent rerenders on hover
export const NodeSourceHandle = memo(
  ({ id, data, handleId, handleClassName }: NodeHandleProps) => {
    const isConnectable = !!NodeOutputTypes[data.type].length;
    const connected = data.connectedSourceHandleIds?.includes(handleId);

    // Memoize class names to prevent string concatenation on every render
    const handleClassName1 = useMemo(
      () => `
      group/handle !w-5 !h-5 z-[1] !bg-transparent !border-none !outline-none !rounded-none
      after:absolute after:w-0 after:h-2 after:border-t-[6px] after:border-t-transparent 
      after:border-b-[6px] after:border-b-transparent after:border-l-[6px] after:border-l-indigo-500 
      after:left-2.5 after:top-1
      hover:scale-125 transition-all
      ${!data._hover && 'after:opacity-0'}
      ${handleClassName}
    `,
      [connected, handleClassName, data._hover]
    );

    return (
      <>
        <Handle
          id={handleId}
          type="source"
          position={Position.Right}
          className={handleClassName1}
          isConnectable={isConnectable}
        ></Handle>
      </>
    );
  }
);
NodeSourceHandle.displayName = 'NodeSourceHandle';
