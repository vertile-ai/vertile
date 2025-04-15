import React from 'react';
import { memo, useCallback, useMemo } from 'react';

import { BlockEnum } from '../types';
import { useNodesExtraData } from '../hooks/hooks';
import type { ToolDefaultValue } from './types';

type BlocksProps = {
  searchText: string;
  onSelect: (type: BlockEnum, tool?: ToolDefaultValue) => void;
  availableBlocksTypes?: BlockEnum[];
};
const Blocks = ({
  searchText,
  onSelect,
  availableBlocksTypes = [],
}: BlocksProps) => {
  
  const nodesExtraData = useNodesExtraData();

  return (
    <div className="p-1">
      {
        <div className="flex items-center px-3 h-[22px] text-xs font-medium text-gray-500">
          No results found
        </div>
      }
    </div>
  );
};

export default memo(Blocks);
