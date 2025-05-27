import type { FC } from 'react';
import React from 'react';

import { type NodeDefault } from '@/app/workflows/[id]/types';

import { Database, File, FilePlus } from '@phosphor-icons/react';
import type { DatasetNodeType } from './types';
import { DatasetNodeInputTypes, DatasetNodeOutputTypes } from './constant';
import { useStore, useStoreApi, type Node as ReactFlowNode } from 'reactflow';

export const DatasetDefault: NodeDefault<DatasetNodeType> = {
  defaultValue: {
    title: 'Dataset',
    description: 'Provides dataset for processing',
  },
  getAvailablePrevNodes() {
    return [];
  },
  getAvailableNextNodes() {
    return [];
  },
  checkValid(data) {
    return {
      isValid: !!data.fileId,
      message: data.fileId ? '' : 'Please upload a dataset file',
    };
  },
};

const DatasetNodeImpl: FC<ReactFlowNode<DatasetNodeType>> = ({ id }) => {
  const node = useStoreApi()
    .getState()
    .getNodes()
    .find((n) => n.id === id);

  if (!node) return null;

  const data = node.data;

  // Define input/output types for the node
  const inputs = DatasetNodeInputTypes.map((type) => ({
    id: `dataset-input-${type}`,
    label: type,
    ioType: type,
  }));

  const outputs = DatasetNodeOutputTypes.map((type) => ({
    id: `dataset-output-${type}`,
    label: type,
    ioType: type,
  }));

  const nodeType = node.data.title || 'Dataset';
  const description =
    node.data.description || 'Provides dataset for processing';

  return (
    <div className="flex flex-col space-y-0.5 mb-1 px-3 py-1 w-full text-neutral-900">
      <div className="h-3/4 px-3 py-2">
        {/* Pass structured data to BaseNode */}
        <div className="flex items-center mb-2">
          <FilePlus className="shrink-0" size={16} color={'black'} />
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

        {data.fileId && data.fileName && (
          <div className="mt-2 flex items-center text-xs text-gray-700">
            <File size={14} className="mr-1" />
            <span>{data.fileName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetNodeImpl;
