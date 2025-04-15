import React, { memo, useCallback, useState } from 'react';
import cn from 'classnames';
import type { EdgeProps } from 'reactflow';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  useNodes,
} from 'reactflow';
import { useAvailableBlocks, useNodesInteractions } from './hooks/hooks';
import type { Edge, OnSelectBlock } from './types';

const CustomEdge = ({
  id,
  data,
  source,
  sourceHandleId,
  target,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
}: EdgeProps) => {
  const nodes = useNodes();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceX,
    sourceY: sourceY,
    sourcePosition: Position.Right,
    targetX: targetX,
    targetY: targetY,
    targetPosition: Position.Left,
    curvature: 0.16,
  });
  const [open, setOpen] = useState(false);
  const { handleNodeAdd } = useNodesInteractions();
  const { availablePrevBlocks } = useAvailableBlocks(
    (data as Edge['data'])?.targetType
  );
  const { availableNextBlocks } = useAvailableBlocks(
    (data as Edge['data'])?.sourceType
  );

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
  }, []);

  const handleInsert = useCallback<OnSelectBlock>(
    (nodeType, toolDefaultValue) => {
      handleNodeAdd(
        {
          nodeType,
          toolDefaultValue,
        },
        {
          prevNodeId: source,
          prevNodeSourceHandle: sourceHandleId || 'source',
          nextNodeId: target,
          nextNodeTargetHandle: targetHandleId || 'target',
        }
      );
    },
    [handleNodeAdd, source, sourceHandleId, target, targetHandleId]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke:
            selected || data?.connectedNodeIsEntered || data?._runned
              ? '#6366f1'
              : '#D0D5DD',
          strokeWidth: 2,
          strokeLinecap: 'round',
        }}
      />
      {/* Source node connection indicator */}
      <rect
        x={sourceX}
        y={sourceY - 1}
        width={4}
        height={2}
        fill={
          selected || data?.connectedNodeIsEntered || data?._runned
            ? '#6366f1'
            : '#D0D5DD'
        }
      />
      {/* Target node connection indicator */}
      <rect
        x={targetX - 4}
        y={targetY - 1}
        width={4}
        height={2}
        fill={
          selected || data?.connectedNodeIsEntered || data?._runned
            ? '#6366f1'
            : '#D0D5DD'
        }
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'nopan nodrag hover:scale-125',
            data?._hovering ? 'block' : 'hidden',
            open && '!block'
          )}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <button
            className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 hover:bg-indigo-50 transition-colors"
            onClick={() => setOpen(!open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {open && (
            <div className="absolute top-8 left-0 z-10 bg-white rounded-md shadow-lg border border-gray-200 p-2 min-w-[120px]">
              <div className="text-xs font-medium text-gray-500 mb-1">
                Insert node:
              </div>
              {availableNextBlocks.map((blockType) => (
                <div
                  key={blockType}
                  className="px-2 py-1 text-sm cursor-pointer hover:bg-indigo-50 rounded"
                  onClick={() => {
                    handleInsert(blockType);
                    setOpen(false);
                  }}
                >
                  {blockType}
                </div>
              ))}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
