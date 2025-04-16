import type { MouseEvent } from 'react';
import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { BlockEnum } from '../../../types';
import type { Node } from '../../../types';
import NodeSelector from '../../../node-selector';
import type { ToolDefaultValue } from '../../../node-selector/types';
import {
  useAvailableBlocks,
  useNodesInteractions,
  useNodesReadOnly,
} from '../../../hooks/hooks';
import { useStore } from '../../../store';
import React from 'react';
type NodeHandleProps = {
  handleId: string;
  handleClassName?: string;
  nodeSelectorClassName?: string;
} & Pick<Node, 'id' | 'data'>;

// Optimized target handle to prevent rerenders on hover
export const NodeTargetHandle = memo(
  ({
    id,
    data,
    handleId,
    handleClassName,
    nodeSelectorClassName,
  }: NodeHandleProps) => {
    const [open, setOpen] = useState(false);
    const { handleNodeAdd } = useNodesInteractions();
    const { getNodesReadOnly } = useNodesReadOnly();
    const connected = data.connectedTargetHandleIds?.includes(handleId);
    const { availablePrevBlocks } = useAvailableBlocks(data.type);
    const isConnectable = !!availablePrevBlocks.length;

    // Memoize callbacks to prevent recreating on every render
    const handleOpenChange = useCallback((v: boolean) => {
      setOpen(v);
    }, []);

    const handleHandleClick = useCallback((e: MouseEvent) => {
      e.stopPropagation();
      setOpen((v) => !v);
    }, []);

    const handleSelect = useCallback(
      (type: BlockEnum, toolDefaultValue?: ToolDefaultValue) => {
        handleNodeAdd(
          {
            nodeType: type,
            toolDefaultValue,
          },
          {
            nextNodeId: id,
            nextNodeTargetHandle: handleId,
          }
        );
      },
      [handleNodeAdd, id, handleId]
    );

    // Memoize class names to prevent string concatenation on every render
    const handleClassName1 = useMemo(
      () => `
      !w-4 !h-4 !bg-transparent !rounded-none !outline-none !border-none z-[1]
      after:absolute after:w-0.5 after:h-2 after:left-1.5 after:top-1 after:bg-primary-500
      hover:scale-125 transition-all
      ${!connected && 'after:opacity-0'}
      ${data.type === BlockEnum.Start && 'opacity-0'}
      ${handleClassName}
    `,
      [connected, data.type, handleClassName]
    );

    // Memoize node selector trigger class name function
    const nodeSelectorTriggerClassName = useCallback(
      (isOpen: boolean) => `
      hidden absolute left-0 top-0 pointer-events-none
      ${nodeSelectorClassName}
      group-hover:!flex
      ${data.selected && '!flex'}
      ${isOpen && '!flex'}
    `,
      [nodeSelectorClassName, data.selected]
    );

    return (
      <>
        <Handle
          id={handleId}
          type="target"
          position={Position.Left}
          className={handleClassName1}
          isConnectable={isConnectable}
          onClick={handleHandleClick}
        >
          {isConnectable && !getNodesReadOnly() && (
            <NodeSelector
              open={open}
              onOpenChange={handleOpenChange}
              onSelect={handleSelect}
              asChild
              placement="left"
              triggerClassName={nodeSelectorTriggerClassName}
              availableBlocksTypes={availablePrevBlocks}
            />
          )}
        </Handle>
      </>
    );
  }
);
NodeTargetHandle.displayName = 'NodeTargetHandle';

// Optimized source handle to prevent rerenders on hover
export const NodeSourceHandle = memo(
  ({
    id,
    data,
    handleId,
    handleClassName,
    nodeSelectorClassName,
  }: NodeHandleProps) => {
    const notInitialWorkflow = useStore((s) => s.notInitialWorkflow);
    const [open, setOpen] = useState(false);
    const { handleNodeAdd } = useNodesInteractions();
    const { getNodesReadOnly } = useNodesReadOnly();
    const { availableNextBlocks } = useAvailableBlocks(data.type);
    const isConnectable = !!availableNextBlocks.length;
    const connected = data.connectedSourceHandleIds?.includes(handleId);

    // Memoize callbacks to prevent recreating on every render
    const handleOpenChange = useCallback((v: boolean) => {
      setOpen(v);
    }, []);

    const handleHandleClick = useCallback((e: MouseEvent) => {
      e.stopPropagation();
      setOpen((v) => !v);
    }, []);

    const handleSelect = useCallback(
      (type: BlockEnum, toolDefaultValue?: ToolDefaultValue) => {
        handleNodeAdd(
          {
            nodeType: type,
            toolDefaultValue,
          },
          {
            prevNodeId: id,
            prevNodeSourceHandle: handleId,
          }
        );
      },
      [handleNodeAdd, id, handleId]
    );

    useEffect(() => {
      if (notInitialWorkflow && data.type === BlockEnum.Start) setOpen(true);
    }, [notInitialWorkflow, data.type]);

    // Memoize class names to prevent string concatenation on every render
    const handleClassName1 = useMemo(
      () => `
      !w-4 !h-4 !bg-transparent !rounded-none !outline-none !border-none z-[1]
      after:absolute after:w-0.5 after:h-2 after:left-1.5 after:top-1 after:bg-primary-500
      hover:scale-125 transition-all
      ${!connected && 'after:opacity-0'}
      ${handleClassName}
    `,
      [connected, handleClassName]
    );

    // Memoize node selector trigger class name function
    const nodeSelectorTriggerClassName = useCallback(
      (isOpen: boolean) => `
      hidden absolute top-0 left-0 pointer-events-none 
      ${nodeSelectorClassName}
      group-hover:!flex
      ${data.selected && '!flex'}
      ${isOpen && '!flex'}
    `,
      [nodeSelectorClassName, data.selected]
    );

    return (
      <>
        <Handle
          id={handleId}
          type="source"
          position={Position.Right}
          className={handleClassName1}
          isConnectable={isConnectable}
          onClick={handleHandleClick}
        >
          {!getNodesReadOnly() && (
            <NodeSelector
              open={open}
              onOpenChange={handleOpenChange}
              onSelect={handleSelect}
              asChild
              triggerClassName={nodeSelectorTriggerClassName}
              availableBlocksTypes={availableNextBlocks}
            />
          )}
        </Handle>
      </>
    );
  }
);
NodeSourceHandle.displayName = 'NodeSourceHandle';
