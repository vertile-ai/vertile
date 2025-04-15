import { memo, useCallback, useMemo } from 'react';

import { intersection } from 'lodash-es';
import BlockSelector from '@/src/components/workflow/node-selector';
import {
  useAvailableBlocks,
  useNodesInteractions,
} from '@/src/components/workflow/hooks/hooks';
import type { Node, OnSelectBlock } from '@/src/components/workflow/types';
import React from 'react';

type ChangeBlockProps = {
  nodeId: string;
  nodeData: Node['data'];
  sourceHandle: string;
};
const ChangeBlock = ({ nodeId, nodeData, sourceHandle }: ChangeBlockProps) => {
  
  const { handleNodeChange } = useNodesInteractions();
  const { availablePrevBlocks, availableNextBlocks } = useAvailableBlocks(
    nodeData.type
  );

  const availableNodes = useMemo(() => {
    if (availablePrevBlocks.length && availableNextBlocks.length)
      return intersection(availablePrevBlocks, availableNextBlocks);
    else if (availablePrevBlocks.length) return availablePrevBlocks;
    else return availableNextBlocks;
  }, [availablePrevBlocks, availableNextBlocks]);

  const handleSelect = useCallback<OnSelectBlock>(
    (type, toolDefaultValue) => {
      handleNodeChange(nodeId, type, sourceHandle, toolDefaultValue);
    },
    [handleNodeChange, nodeId, sourceHandle]
  );

  const renderTrigger = useCallback(() => {
    return (
      <div className="flex items-center px-3 w-[232px] h-8 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50">
        Change Block
      </div>
    );
  }, []);

  return (
    <BlockSelector
      placement="bottom-end"
      offset={{
        mainAxis: -36,
        crossAxis: 4,
      }}
      onSelect={handleSelect}
      trigger={renderTrigger}
      popupClassName="min-w-[240px]"
      availableBlocksTypes={availableNodes}
    />
  );
};

export default memo(ChangeBlock);
