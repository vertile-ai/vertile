import type { FC, MouseEventHandler } from 'react';
import { memo, useCallback, useState } from 'react';

import type { OffsetOptions, Placement } from '@floating-ui/react';
import type { BlockEnum, OnSelectBlock } from '../types';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/src/components/reusable/FollowPortal.component';
import React from 'react';
import { PlusCircle } from '@phosphor-icons/react/dist/ssr';
import { Cross, FileSearch } from '@phosphor-icons/react';

type NodeSelectorProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: OnSelectBlock;
  trigger?: (open: boolean) => React.ReactNode;
  placement?: Placement;
  offset?: OffsetOptions;
  triggerStyle?: React.CSSProperties;
  triggerClassName?: (open: boolean) => string;
  triggerInnerClassName?: string;
  popupClassName?: string;
  asChild?: boolean;
  availableBlocksTypes?: BlockEnum[];
  disabled?: boolean;
  noBlocks?: boolean;
};
const NodeSelector: FC<NodeSelectorProps> = ({
  open: openFromProps,
  onOpenChange,
  onSelect,
  trigger,
  placement = 'right',
  offset = 6,
  triggerClassName,
  triggerInnerClassName,
  triggerStyle,
  popupClassName,
  asChild,
  availableBlocksTypes,
  disabled,
  noBlocks = false,
}) => {
  
  const [searchText, setSearchText] = useState('');
  const [localOpen, setLocalOpen] = useState(false);
  const open = openFromProps === undefined ? localOpen : openFromProps;
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setLocalOpen(newOpen);

      if (onOpenChange) onOpenChange(newOpen);
    },
    [onOpenChange]
  );
  const handleTrigger = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      if (disabled) return;
      e.stopPropagation();
      handleOpenChange(!open);
    },
    [handleOpenChange, open, disabled]
  );
  const handleSelect = useCallback<OnSelectBlock>(
    (type, toolDefaultValue) => {
      handleOpenChange(false);
      onSelect(type, toolDefaultValue);
    },
    [handleOpenChange, onSelect]
  );

  return (
    <PortalToFollowElem
      placement={placement}
      offset={offset}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PortalToFollowElemTrigger
        asChild={asChild}
        onClick={handleTrigger}
        className={triggerInnerClassName}
      >
        {trigger ? (
          trigger(open)
        ) : (
          <div
            className={`
                  flex items-center justify-center 
                  w-4 h-4 rounded-full bg-primary-600 cursor-pointer z-10
                  ${triggerClassName?.(open)}
                `}
            style={triggerStyle}
          >
            <PlusCircle size={24} color="white" weight="fill" />
          </div>
        )}
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-[1000]">
        <div
          className={`rounded-lg border-[0.5px] border-gray-200 bg-white shadow-lg ${popupClassName}`}
        >
          <div className="px-2 pt-2">
            <div
              className="flex items-center px-2 rounded-lg bg-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <FileSearch className="shrink-0 ml-[1px] mr-[5px] w-3.5 h-3.5 text-gray-400" />
              <input
                value={searchText}
                className="grow px-0.5 py-[7px] text-[13px] text-gray-700 bg-transparent appearance-none outline-none caret-primary-600 placeholder:text-gray-400"
                placeholder="Search blocks"
                onChange={(e) => setSearchText(e.target.value)}
                autoFocus
              />
              {searchText && (
                <div
                  className="flex items-center justify-center ml-[5px] w-[18px] h-[18px] cursor-pointer"
                  onClick={() => setSearchText('')}
                >
                  <Cross className="w-[14px] h-[14px] text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  );
};

export default memo(NodeSelector);
