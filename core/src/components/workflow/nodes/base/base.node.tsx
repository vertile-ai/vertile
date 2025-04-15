import React, { useState, type FC, type ReactElement } from 'react';
import { cloneElement, memo, useEffect, useMemo, useRef } from 'react';
import cn from 'classnames';
import type { NodeProps } from '../../types';
import { BlockEnum, NodeRunningStatus } from '../../types';
import { NodeSourceHandle, NodeTargetHandle } from './components/node-handle';
import NodeControl from './components/node-control';

type BaseNodeProps = {
  children: ReactElement;
} & NodeProps & { className?: string };

const BaseNode: FC<BaseNodeProps> = ({ id, data, children, className }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  const [nodeHeight, setNodeHeight] = useState(0);

  useEffect(() => {
    if (!nodeRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setNodeHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(nodeRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const showSelectedBorder = data.selected || data._isEntering;
  const { showRunningBorder, showSuccessBorder, showFailedBorder } =
    useMemo(() => {
      return {
        showRunningBorder:
          data._runningStatus === NodeRunningStatus.Running &&
          !showSelectedBorder,
        showSuccessBorder:
          data._runningStatus === NodeRunningStatus.Succeeded &&
          !showSelectedBorder,
        showFailedBorder:
          data._runningStatus === NodeRunningStatus.Failed &&
          !showSelectedBorder,
      };
    }, [data._runningStatus, showSelectedBorder]);

  return (
    <div
      className={cn(
        'flex border-[2px] rounded-2xl',
        showSelectedBorder ? 'border-primary-600' : 'border-transparent',
        className
      )}
      ref={nodeRef}
    >
      <div
        className={cn(
          'group relative pb-1 shadow-xs',
          'border border-transparent rounded-[15px]',
          'w-[240px] bg-white text-gray-800',
          !data._runningStatus && 'hover:shadow-lg',
          showRunningBorder && '!border-primary-500',
          showSuccessBorder && '!border-[#12B76A]',
          showFailedBorder && '!border-[#F04438]'
        )}
      >
        {
          <NodeTargetHandle
            id={id}
            data={data}
            handleClassName="!-left-2.5 !top-1/2 !-translate-y-1/2"
            handleId="target"
          />
        }
        {data.type !== BlockEnum.IfElse && (
          <NodeSourceHandle
            id={id}
            data={data}
            handleClassName="!-right-2.5 !top-1/2 !-translate-y-1/2"
            handleId="source"
          />
        )}
        {!data._runningStatus && <NodeControl id={id} data={data} />}
        {cloneElement(children, { id, data })}

        <div className="px-3 pt-1 pb-2 text-xs leading-[18px] text-gray-600 whitespace-pre-line break-words">
          {data.desc}
        </div>
      </div>
    </div>
  );
};

export default memo(BaseNode);
