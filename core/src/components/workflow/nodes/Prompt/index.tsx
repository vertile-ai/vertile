import type { FC } from 'react';
import React from 'react';

import {
  NodeRunningStatus,
  type CommonNodeType,
  type NodeDefault,
  BlockEnum,
} from '@/src/components/workflow/types';

import type { NodeProps } from '@/src/components/workflow/types';
import { ALL_COMPLETION_AVAILABLE_BLOCKS } from '../../constants';
import {
  SpinnerGap,
  CheckCircle,
  Warning,
  ChatText,
} from '@phosphor-icons/react';
import { IOType } from '../../io.types';
import { PromptNode as PromptNodeType } from './types';
import { PromptOutput } from './constant';
import { PromptInput } from './constant';
import { getAvailableNextNodes, getAvailablePrevNodes } from '../../utils';

export const PromptDefault: NodeDefault<PromptNodeType> = {
  defaultValue: {
    title: 'Prompt',
    prompt: 'Write a response about:',
    temperature: 0.7,
    maxTokens: 1000,
  },
  getAvailablePrevNodes() {
    return getAvailablePrevNodes(PromptInput);
  },
  getAvailableNextNodes() {
    return getAvailableNextNodes(PromptOutput);
  },
  checkValid(data) {
    // Validate that the prompt has content
    if (!data.prompt || data.prompt.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Prompt cannot be empty',
      };
    }
    return {
      isValid: true,
    };
  },
};

const PromptNodeImpl: FC<PromptNodeType> = (data) => {
  return (
    <div className="flex flex-col space-y-0.5 mb-1 px-3 py-1 w-full text-neutral-900">
      <div
        className={
          'flex items-center px-3 pt-3 pb-2 rounded-t-2xl bg-[rgba(250,252,255,0.9)]'
        }
      >
        <ChatText className="shrink-0 mr-2" size={16} color={'black'} />
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
    </div>
  );
};

export default PromptNodeImpl;
