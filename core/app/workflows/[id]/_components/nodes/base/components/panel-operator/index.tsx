import { memo, useCallback, useState } from 'react';
import type { OffsetOptions } from '@floating-ui/react';
import PanelOperatorPopup from './panel-operator-popup';
import { Node } from '@/app/workflows/[id]/_components/nodes/types';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/ui/FollowPortal';
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr';
import React from 'react';

type PanelOperatorProps = {
  id: string;
  data: Node['data'];
  triggerClassName?: string;
  offset?: OffsetOptions;
  onOpenChange?: (open: boolean) => void;
  inNode?: boolean;
  showHelpLink?: boolean;
};
const PanelOperator = ({
  id,
  data,
  triggerClassName,
  offset = {
    mainAxis: 4,
    crossAxis: 53,
  },
  onOpenChange,
  inNode,
  showHelpLink = true,
}: PanelOperatorProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);

      if (onOpenChange) onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <PortalToFollowElem
      placement="bottom-end"
      offset={offset}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PortalToFollowElemTrigger onClick={() => handleOpenChange(!open)}>
        <div
          className={`
            flex items-center justify-center w-6 h-6 rounded-md cursor-pointer
            hover:bg-gray-100
            ${open && 'bg-gray-100'}
            ${triggerClassName}
          `}
        >
          <DotsThreeOutline color="#6B7280" />
        </div>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-[11]">
        <PanelOperatorPopup
          id={id}
          data={data}
          onClosePopup={() => setOpen(false)}
          showHelpLink={showHelpLink}
        />
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  );
};

export default memo(PanelOperator);
