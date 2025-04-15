import React from 'react';
import { memo } from 'react';
import type { ConnectionLineComponentProps } from 'reactflow';
import { Position, getBezierPath } from 'reactflow';

const CustomConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: Position.Right,
    targetX: toX,
    targetY: toY,
    targetPosition: Position.Left,
    curvature: 0.16,
  });

  return (
    <g>
      <path fill="none" stroke="#D0D5DD" strokeWidth={2} d={edgePath} />
      <rect x={fromX} y={fromY - 1} width={4} height={2} fill="#6366f1" />
      <rect x={toX - 4} y={toY - 1} width={4} height={2} fill="#6366f1" />
    </g>
  );
};

export default memo(CustomConnectionLine);
