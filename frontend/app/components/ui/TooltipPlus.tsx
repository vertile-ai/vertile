'use client';
import type { FC } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import type { OffsetOptions, Placement } from '@floating-ui/react';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from './FollowPortal';

export type TooltipProps = {
  position?: Placement;
  popupContent: React.ReactNode;
  children: React.ReactNode;
  hideArrow?: boolean;
  popupClassName?: string;
  offset?: OffsetOptions;
};

const arrow = (
  <svg
    className="absolute text-white h-2 w-full left-0 top-full"
    x="0px"
    y="0px"
    viewBox="0 0 255 255"
  >
    <polygon className="fill-current" points="0,0 127.5,127.5 255,0"></polygon>
  </svg>
);

export const TooltipPlus: FC<TooltipProps> = ({
  position = 'top',
  popupContent,
  children,
  hideArrow,
  popupClassName,
  offset = 10,
}) => {
  const [open, setOpen] = useState(false);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);

  const isHoveringPopupRef = useRef(isHoveringPopup);
  useEffect(() => {
    isHoveringPopupRef.current = isHoveringPopup;
  }, [isHoveringPopup]);

  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);

  const isHoveringTriggerRef = useRef(isHoveringTrigger);
  useEffect(() => {
    isHoveringTriggerRef.current = isHoveringTrigger;
  }, [isHoveringTrigger]);

  const handleTriggerMouseEnter = useCallback(() => {
    setIsHoveringTrigger(true);
    setOpen(true);
  }, []);

  const handleTriggerMouseLeave = useCallback(() => {
    setIsHoveringTrigger(false);
    setOpen(false);
  }, []);

  const handlePopupMouseEnter = useCallback(() => {
    setIsHoveringPopup(true);
  }, []);
  const handlePopupMouseLeave = useCallback(() => {
    setIsHoveringTrigger(false);
    setOpen(false);
  }, []);

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement={position}
      offset={offset}
    >
      <PortalToFollowElemTrigger
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        className="w-full"
      >
        {children}
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-[9999]">
        <div
          className={cn(
            'relative px-3 py-2 text-xs font-normal text-gray-700 bg-white rounded-md shadow-lg',
            popupClassName
          )}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          {popupContent}
          {!hideArrow && arrow}
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  );
};
