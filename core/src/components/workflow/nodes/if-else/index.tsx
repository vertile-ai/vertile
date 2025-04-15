import type { FC } from 'react';
import React from 'react';

import type { NodeProps } from 'reactflow';
import { NodeSourceHandle } from '../base/components/node-handle';
import {
  isComparisonOperatorNeedTranslate,
  isEmptyRelatedOperator,
} from './utils';
import type { IfElseNodeType } from './types';
import {
  CheckCircle,
  PlayCircle,
  SpinnerGap,
  TestTube,
  TreeStructure,
  Warning,
} from '@phosphor-icons/react';
import { NodeRunningStatus } from '../../types';
const i18nPrefix = 'workflow.nodes.ifElse';

const IfElseNodeImpl: FC<IfElseNodeType> = (data) => {
  const { conditions, logical_operator } = data;

  return (
    <div className="px-3">
      <div
        className={
          'flex items-center px-3 pt-3 pb-2 rounded-t-2xl bg-[rgba(250,252,255,0.9)]'
        }
      >
        <TreeStructure className="shrink-0 mr-2" size={16} color={'black'} />
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
      <div className="relative flex items-center h-6 px-1">
        <div className="w-full text-xs font-semibold text-right text-gray-700">
          IF
        </div>
        <NodeSourceHandle
          id={data.id}
          data={data}
          handleId="true"
          handleClassName="!-right-2.5 !top-1/2 !-translate-y-1/2"
        />
      </div>
      <div className="space-y-0.5">
        {conditions?.map((condition, i) => (
          <div key={condition.id} className="relative">
            {condition.variable_selector?.length > 0 &&
            condition.comparison_operator &&
            (isEmptyRelatedOperator(condition.comparison_operator!)
              ? true
              : !!condition.value) ? (
              <div className="flex items-center h-6 px-1 space-x-1 text-xs font-normal text-gray-700 bg-gray-100 rounded-md">
                <TestTube className="w-3.5 h-3.5 text-primary-500" />
                <span>{condition.variable_selector.slice(-1)[0]}</span>
                <span className="text-gray-500">
                  {condition.comparison_operator}
                </span>
                {!isEmptyRelatedOperator(condition.comparison_operator!) && (
                  <span>{condition.value}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center h-6 px-1 space-x-1 text-xs font-normal text-gray-500 bg-gray-100 rounded-md">
                conditionNotSetup
              </div>
            )}
            {i !== conditions.length - 1 && (
              <div className="absolute z-10 right-0 bottom-[-10px] leading-4 text-[10px] font-medium text-primary-600 uppercase">
                Logical Operator
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="relative flex items-center h-6 px-1">
        <div className="w-full text-xs font-semibold text-right text-gray-700">
          ELSE
        </div>
        <NodeSourceHandle
          id={data.id}
          data={data}
          handleId="false"
          handleClassName="!-right-2.5 !top-1/2 !-translate-y-1/2"
        />
      </div>
    </div>
  );
};

export default React.memo(IfElseNodeImpl);
