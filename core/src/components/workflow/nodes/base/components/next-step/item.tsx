import { memo, useCallback } from 'react';

import { intersection } from 'lodash-es';
import type {
  CommonNodeType,
  OnSelectBlock,
} from '@/src/components/workflow/types';
import NodeIcon from '@/src/components/workflow/nodes/icons';
import BlockSelector from '@/src/components/workflow/node-selector';
import {
  useAvailableBlocks,
  useNodesInteractions,
  useNodesReadOnly,
} from '@/src/components/workflow/hooks/hooks';
import React from 'react';
import { Button } from '@/src/components/reusable/Button.component';

type ItemProps = {
  nodeId: string;
  sourceHandle: string;
  branchName?: string;
  data: CommonNodeType;
};
const Item = ({ nodeId, sourceHandle, branchName, data }: ItemProps) => {
  
  const { handleNodeChange } = useNodesInteractions();
  const { nodesReadOnly } = useNodesReadOnly();
  const { availablePrevBlocks, availableNextBlocks } = useAvailableBlocks(
    data.type
  );

  const handleSelect = useCallback<OnSelectBlock>(
    (type, toolDefaultValue) => {
      handleNodeChange(nodeId, type, sourceHandle, toolDefaultValue);
    },
    [nodeId, sourceHandle, handleNodeChange]
  );
  const renderTrigger = useCallback(
    (open: boolean) => {
      return (
        <Button
          className={`
          hidden group-hover:flex px-2 py-0 h-6 bg-white text-xs text-gray-700 font-medium rounded-md
          ${open && '!bg-gray-100 !flex'}
        `}
        >
          Change
        </Button>
      );
    },
    []
  );

  return (
    <div className="relative group flex items-center mb-3 last-of-type:mb-0 px-2 h-9 rounded-lg border-[0.5px] border-gray-200 bg-white hover:bg-gray-50 shadow-xs text-xs text-gray-700 cursor-pointer">
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
      <NodeIcon type={data.type} className="shrink-0 mr-1.5" />
      <div className="grow">{data.title}</div>
      {!nodesReadOnly && (
        <BlockSelector
          onSelect={handleSelect}
          placement="top-end"
          offset={{
            mainAxis: 6,
            crossAxis: 8,
          }}
          trigger={renderTrigger}
          popupClassName="!w-[328px]"
          availableBlocksTypes={intersection(
            availablePrevBlocks,
            availableNextBlocks
          ).filter((item) => item !== data.type)}
        />
      )}
    </div>
  );
};

export default memo(Item);
