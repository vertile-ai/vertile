import type { FC } from 'react';
import React from 'react';

import {
  NodeRunningStatus,
  type CommonNodeType,
  type NodeDefault,
} from '@/src/components/workflow/types';

import { ALL_COMPLETION_AVAILABLE_BLOCKS } from '../../constants';
import {
  SpinnerGap,
  CheckCircle,
  Warning,
  Database,
  MathOperations,
} from '@phosphor-icons/react';
import { TrainNode } from './types';

export interface TrainNodeType extends CommonNodeType {
  trainingMethod: string;
}

export const TrainDefault: NodeDefault<TrainNodeType> = {
  defaultValue: {},
  getAvailablePrevNodes() {
    return [...ALL_COMPLETION_AVAILABLE_BLOCKS];
  },
  getAvailableNextNodes() {
    const nodes = ALL_COMPLETION_AVAILABLE_BLOCKS;
    return nodes;
  },
  checkValid() {
    return {
      isValid: true,
    };
  },
};

const TrainNodeImpl: FC<TrainNode> = (data) => {
  return (
    <div className="flex flex-col space-y-0.5 mb-1 px-3 py-1 w-full text-neutral-900">
      <div
        className={
          'flex items-center px-3 pt-3 pb-2 rounded-t-2xl bg-[rgba(250,252,255,0.9)]'
        }
      >
        <MathOperations className="shrink-0 mr-2" size={16} color={'black'} />
        <div
          title={data.title}
          className="grow mr-1 text-[13px] font-semibold text-gray-700 truncate"
        >
          {data.title}
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
      <div className="w-px bg-gray-700"></div>
      <div className="h-3/4">{data.trainingMethod}</div>
    </div>
  );
};

export default TrainNodeImpl;
