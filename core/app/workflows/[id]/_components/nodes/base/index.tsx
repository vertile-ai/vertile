import React, { type FC, type ReactElement } from 'react';
import { cloneElement, memo, useMemo, useRef } from 'react';
import cn from 'classnames';
import { NodeSourceHandle, NodeTargetHandle } from './components/node-handle';
import NodeControl from './components/node-control';
import { NodeRunningStatus } from '@/app/workflows/[id]/types';

const BaseNode: FC<any> = ({ id, data, children, className }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  const showSelectedBorder = data.selected;
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
        'flex border-[2px]',
        showSelectedBorder ? 'border-primary-600' : 'border-transparent',
        className
      )}
      ref={nodeRef}
    >
      <div
        className={cn(
          'group relative pb-1 shadow-xs',
          'border border-transparent',
          'w-[240px] bg-white text-gray-800',
          'hover:shadow-lg',
          showRunningBorder && '!border-primary-500',
          showSuccessBorder && '!border-[#12B76A]',
          showFailedBorder && '!border-[#F04438]'
        )}
      >
        <NodeTargetHandle
          id={id}
          data={data}
          handleClassName="!top-4 !-left-[13px] !translate-y-0"
          handleId="target"
        />

        <NodeSourceHandle
          id={id}
          data={data}
          handleClassName="!top-4 !-right-[13px] !translate-y-0"
          handleId="source"
        />

        {!data._runningStatus && <NodeControl id={id} data={data} />}
        {cloneElement(children, { id, data })}
      </div>
    </div>
  );
};

export default memo(BaseNode);
