import { memo, useCallback } from 'react';

import {
  useNodesExtraData,
  useNodesInteractions,
  useNodesReadOnly,
} from '@/src/components/workflow/hooks/hooks';
import BlockSelector from '@/src/components/workflow/node-selector';
import type { BlockEnum, OnSelectBlock } from '@/src/components/workflow/types';
import React from 'react';
import { Plus } from '@phosphor-icons/react';

type AddProps = {
  nodeId: string;
  nodeType: BlockEnum;
  sourceHandle: string;
  branchName?: string;
};
const Add = ({ nodeId, nodeType, sourceHandle, branchName }: AddProps) => {
  
  const { handleNodeAdd } = useNodesInteractions();
  const nodesExtraData = useNodesExtraData();
  const { nodesReadOnly } = useNodesReadOnly();
  const availableNextNodes = nodesExtraData[nodeType].availableNextNodes;

  const handleSelect = useCallback<OnSelectBlock>(
    (type, toolDefaultValue) => {
      handleNodeAdd(
        {
          nodeType: type,
          toolDefaultValue,
        },
        {
          prevNodeId: nodeId,
          prevNodeSourceHandle: sourceHandle,
        }
      );
    },
    [nodeId, sourceHandle, handleNodeAdd]
  );

  const renderTrigger = useCallback(
    (open: boolean) => {
      return (
        <div
          className={`
          relative flex items-center px-2 h-9 rounded-lg border border-dashed border-gray-200 bg-gray-50 
          hover:bg-gray-100 text-xs text-gray-500 cursor-pointer
          ${open && '!bg-gray-100'}
          ${nodesReadOnly && '!cursor-not-allowed'}
        `}
        >
          {branchName && (
            <div
              className="absolute left-1 right-1 -top-[7.5px] flex items-center h-3 text-[10px] text-gray-500 font-semibold"
              title={branchName.toLocaleUpperCase()}
            >
              <div className="inline-block px-0.5 rounded-[5px] bg-white truncate">
                {branchName.toLocaleUpperCase()}
              </div>
            </div>
          )}
          <div className="flex items-center justify-center mr-1.5 w-5 h-5 rounded-[5px] bg-gray-200">
            <Plus className="w-3 h-3" />
          </div>
          Select next step
        </div>
      );
    },
    [branchName, nodesReadOnly]
  );

  return (
    <BlockSelector
      disabled={nodesReadOnly}
      onSelect={handleSelect}
      placement="top"
      offset={0}
      trigger={renderTrigger}
      popupClassName="!w-[328px]"
      availableBlocksTypes={availableNextNodes}
    />
  );
};

export default memo(Add);
