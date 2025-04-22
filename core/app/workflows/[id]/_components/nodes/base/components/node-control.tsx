import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';

import PanelOperator from './panel-operator';
import React from 'react';
import { Node } from '../../types';

type NodeControlProps = Pick<Node, 'id' | 'data'>;
const NodeControl: FC<NodeControlProps> = ({ id, data }) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  return (
    <div
      className={`
      hidden group-hover:flex pb-1 absolute right-0 -top-7 h-7
      ${data.selected && '!flex'}
      ${open && '!flex'}
      `}
    >
      <div
        className="flex items-center px-0.5 h-6 bg-white rounded-lg border-[0.5px] border-gray-200 shadow-xs text-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <PanelOperator
          id={id}
          data={data}
          offset={0}
          onOpenChange={handleOpenChange}
          triggerClassName="!w-5 !h-5"
        />
      </div>
    </div>
  );
};

export default memo(NodeControl);
