import React, { memo, useMemo } from 'react';
import cn from 'classnames';
import type { EdgeProps } from 'reactflow';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from 'reactflow';
import { CommonEdgeType } from '@/app/workflows/[id]/_components/nodes/types';

const CustomEdge = ({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
}: EdgeProps<CommonEdgeType>) => {
  const [edgePath] = getBezierPath({
    sourceX: sourceX - 8,
    sourceY: sourceY,
    sourcePosition: Position.Right,
    targetX: targetX + 8,
    targetY: targetY,
    targetPosition: Position.Left,
    curvature: 0.16,
  });

  const getEdgeStyle = (
    selected,
    connectedNodeIsEntered,
    runned,
    hovering
  ) => ({
    stroke:
      selected || connectedNodeIsEntered || runned || hovering
        ? '#6366f1'
        : '#D0D5DD',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
  });

  // Inside your component
  const edgeStyle = useMemo(
    () =>
      getEdgeStyle(
        selected,
        data?.connectedNodeIsEntered,
        data?._runned,
        data?._hovering
      ),
    [selected, data?.connectedNodeIsEntered, data?._runned, data?._hovering]
  );

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'nopan nodrag hover:scale-125',
            data?._hovering ? 'block' : 'hidden'
          )}
        ></div>
      </EdgeLabelRenderer>
    </>
  );
};

CustomEdge.displayName = 'CustomEdge';

export default memo(CustomEdge);
