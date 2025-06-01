import type { FC } from 'react';
import React from 'react';

import { Brain } from '@phosphor-icons/react';
import { ModelNodeType } from './types';
import { IOType } from '../types';
import { NodeDefault } from '../../../types';

export const ModelDefault: NodeDefault<ModelNodeType> = {
  defaultValue: {
    description: 'Provides model for inference or training',
  },
  getAvailablePrevNodes() {
    return [];
  },
  getAvailableNextNodes() {
    return [];
  },
  checkValid() {
    return {
      isValid: true,
    };
  },
};

const ModelNodeImpl: FC<ModelNodeType> = (data) => {
  // Define input/output types for the node
  const inputs = [
    { id: 'model-input-prompt', label: 'Prompt', ioType: IOType.text },
    { id: 'model-input-parameters', label: 'Params', ioType: IOType.kv },
  ];

  const outputs = [
    { id: 'model-output-completion', label: 'Output', ioType: IOType.llm },
  ];

  const icon = <Brain className="shrink-0" size={16} color={'black'} />;
  const nodeType = 'Model';
  const description =
    data.description || 'Provides model for inference or training';

  return (
    <div className="flex flex-col space-y-0.5 mb-1 px-3 py-1 w-full text-neutral-900">
      <div className="h-3/4 px-3 py-2">
        {/* Pass structured data to BaseNode */}
        <div className="flex items-center mb-2">
          {icon}
          <span className="font-medium ml-2">{nodeType}</span>
        </div>

        <div className="text-xs text-gray-600 mb-3">{description}</div>

        <div className="flex flex-col gap-2">
          {/* Input types display */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700 min-w-[40px]">
              Input:
            </span>
            <div className="flex flex-wrap gap-1">
              {inputs.map((input, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {input.label}
                </span>
              ))}
            </div>
          </div>

          {/* Output types display */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700 min-w-[40px]">
              Output:
            </span>
            <div className="flex flex-wrap gap-1">
              {outputs.map((output, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-100"
                >
                  {output.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs font-medium text-gray-700">
          {data.modelName}
        </div>
      </div>
    </div>
  );
};

export default ModelNodeImpl;
