import type { FC } from 'react';
import React from 'react';

import { Lightbulb } from '@phosphor-icons/react';
import { TrainNodeType } from './types';
import { BlockEnum, IOType } from '../types';
import { NodeDefault } from '../../../types';

export const TrainDefault: NodeDefault<TrainNodeType> = {
  defaultValue: {
    description: 'Trains models using provided datasets',
  },
  getAvailablePrevNodes() {
    return [BlockEnum.Dataset] as BlockEnum[];
  },
  getAvailableNextNodes() {
    return [BlockEnum.Prompt] as BlockEnum[];
  },
  checkValid() {
    return {
      isValid: true,
    };
  },
};

const TrainNodeImpl: FC<TrainNodeType> = (data) => {
  // Define input/output types for the node
  const inputs = [
    { id: 'train-input-model', label: 'Model', ioType: IOType.llm },
    { id: 'train-input-dataset', label: 'Dataset', ioType: IOType.kv },
  ];

  const outputs = [
    { id: 'train-output-model', label: 'Trained Model', ioType: IOType.llm },
  ];

  const icon = <Lightbulb className="shrink-0" size={16} color={'black'} />;
  const nodeType = 'Train';
  const description =
    data.description || 'Trains models using provided datasets';

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
          {data.trainingMethod}
        </div>
      </div>
    </div>
  );
};

export default TrainNodeImpl;
