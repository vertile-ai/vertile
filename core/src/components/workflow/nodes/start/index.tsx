import type { FC } from 'react';
import React from 'react';
import { NodeRunningStatus, type NodeProps } from '@/src/components/workflow/types';
import {
  CheckCircle,
  PlayCircle,
  SpinnerGap,
  Warning,
} from '@phosphor-icons/react';
import { StartNode } from './types';

const StartNodeImpl: FC<StartNode> = (data) => {
  return (
    <div className="mb-1 px-3 pt-3 pb-2">
      <div
        className={'flex items-cente rounded-t-2xl bg-[rgba(250,252,255,0.9)]'}
      >
        <PlayCircle className="shrink-0 mr-2" size={20} color={'black'} />
        <div
          className="grow mr-1 text-[13px] font-semibold text-gray-700 truncate"
        >
          Start 
        </div>
        {(data._runningStatus === NodeRunningStatus.Running ||
          data._singleRunningStatus === NodeRunningStatus.Running) && (
          <SpinnerGap className="w-3.5 h-3.5 text-primary-600 animate-spin" />
        )}
        {data._runningStatus === NodeRunningStatus.Succeeded && (
          <CheckCircle className="w-3.5 h-3.5 text-[#12B76A]" />
        )}
        {data._runningStatus === NodeRunningStatus.Failed && (
          <Warning className="w-3.5 h-3.5" color="#F04438" />
        )}
      </div>
    </div>
  );
};

export default React.memo(StartNodeImpl);
